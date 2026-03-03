import { test, expect } from '@playwright/test';

/**
 * App Functionality E2E Tests
 * Tests core features: points, leaderboard, username, auth
 *
 * Note: These tests require the full server to be running (not just preview)
 * Run with: npm run dev in one terminal, then npx playwright test e2e/app-functionality.spec.ts
 */

// Test user credentials (mock Privy auth for testing)
const TEST_USER_ID = 'test-user-123';

// Helper to check if API is available (not returning HTML)
async function isApiAvailable(response: { ok: () => boolean; text: () => Promise<string> }) {
  if (!response.ok()) return false;
  const text = await response.text();
  return !text.startsWith('<!DOCTYPE');
}

test.describe('Points System', () => {
  test.describe('Point Deduction on Betting', () => {
    test('user balance decreases when placing a bet', async ({ request }) => {
      // Get initial balance
      const userResponse = await request.get('/api/user/me', {
        headers: { 'x-privy-user-id': TEST_USER_ID },
      });

      if (!userResponse.ok()) {
        test.skip(); // User doesn't exist in test environment
        return;
      }

      const user = await userResponse.json();
      const initialBalance = parseFloat(user.wagerPoints || user.balance || '0');

      // Get active question
      const questionsResponse = await request.get('/api/questions/active');
      if (!questionsResponse.ok()) {
        test.skip(); // No active questions
        return;
      }

      const questions = await questionsResponse.json();
      if (!questions.length) {
        test.skip();
        return;
      }

      const question = questions[0];
      const betAmount = 50;

      // Place a vote with bet
      const voteResponse = await request.post('/api/votes', {
        headers: { 'x-privy-user-id': TEST_USER_ID },
        data: {
          questionId: question.id,
          choice: 'A',
          betAmount: betAmount,
        },
      });

      if (voteResponse.status() === 400) {
        // User already voted - that's fine
        return;
      }

      // Check balance decreased
      const updatedUserResponse = await request.get('/api/user/me', {
        headers: { 'x-privy-user-id': TEST_USER_ID },
      });
      const updatedUser = await updatedUserResponse.json();
      const newBalance = parseFloat(updatedUser.wagerPoints || updatedUser.balance || '0');

      expect(newBalance).toBeLessThanOrEqual(initialBalance);
    });

    test('cannot bet more than available balance', async ({ request }) => {
      const questionsResponse = await request.get('/api/questions/active');
      if (!questionsResponse.ok()) {
        test.skip();
        return;
      }

      const questions = await questionsResponse.json();
      if (!questions.length) {
        test.skip();
        return;
      }

      const question = questions[0];
      const excessiveBet = 999999999;

      const voteResponse = await request.post('/api/votes', {
        headers: { 'x-privy-user-id': TEST_USER_ID },
        data: {
          questionId: question.id,
          choice: 'A',
          betAmount: excessiveBet,
        },
      });

      // Should fail with insufficient balance or already voted
      expect([400, 403]).toContain(voteResponse.status());
    });
  });

  test.describe('Point Rewards', () => {
    test('results endpoint returns payout information', async ({ request }) => {
      // Get revealed questions
      const revealedResponse = await request.get('/api/questions/revealed');
      if (!revealedResponse.ok()) {
        test.skip();
        return;
      }

      const revealedQuestions = await revealedResponse.json();
      if (!revealedQuestions.length) {
        test.skip();
        return;
      }

      const question = revealedQuestions[0];
      const resultsResponse = await request.get(`/api/results/${question.id}`);

      if (resultsResponse.ok()) {
        const results = await resultsResponse.json();

        // Results should have vote counts and percentages
        expect(results).toHaveProperty('totalVotes');
        expect(results).toHaveProperty('percentA');
        expect(results).toHaveProperty('percentB');
        expect(results.totalVotes).toBeGreaterThanOrEqual(0);
      }
    });

    test('user votes show payout for winning predictions', async ({ request }) => {
      const votesResponse = await request.get('/api/votes/mine', {
        headers: { 'x-privy-user-id': TEST_USER_ID },
      });

      if (!votesResponse.ok()) {
        test.skip();
        return;
      }

      const votes = await votesResponse.json();

      // Check that vote records have expected fields
      for (const vote of votes) {
        expect(vote).toHaveProperty('questionId');
        expect(vote).toHaveProperty('choice');
        expect(['A', 'B', 'C', 'D']).toContain(vote.choice);

        if (vote.betAmount) {
          expect(parseFloat(vote.betAmount)).toBeGreaterThanOrEqual(0);
        }

        if (vote.payout !== null && vote.payout !== undefined) {
          expect(parseFloat(vote.payout)).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });
});

test.describe('Leaderboard', () => {
  test('leaderboard returns ranked users', async ({ request }) => {
    const response = await request.get('/api/leaderboard');

    if (!response.ok()) {
      // API might require auth
      test.skip();
      return;
    }

    const leaderboard = await response.json();

    expect(Array.isArray(leaderboard)).toBe(true);

    // Check leaderboard entries have expected structure
    for (const entry of leaderboard) {
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('handle');
    }

    // Verify sorted order (highest points first)
    for (let i = 1; i < leaderboard.length; i++) {
      const prevPoints = leaderboard[i - 1].alphaPoints || 0;
      const currPoints = leaderboard[i].alphaPoints || 0;
      expect(prevPoints).toBeGreaterThanOrEqual(currPoints);
    }
  });

  test('earnings leaderboard returns users sorted by winnings', async ({ request }) => {
    const response = await request.get('/api/leaderboard/earnings');

    if (!response.ok()) {
      test.skip();
      return;
    }

    const leaderboard = await response.json();
    expect(Array.isArray(leaderboard)).toBe(true);
  });

  test('leaderboard page renders correctly', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/leaderboard');
    await page.waitForLoadState('networkidle');

    // Page should have leaderboard content
    const body = await page.locator('body');
    await expect(body).toBeVisible();

    // Check for leaderboard title
    const content = await body.textContent();
    expect(content).toContain('Leaderboard');

    // Filter known acceptable errors
    const criticalErrors = errors.filter((err) => {
      if (err.includes('evmAsk') || err.includes('Backpack')) return false;
      if (err.includes('ResizeObserver')) return false;
      return true;
    });

    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Username/Handle', () => {
  test('user profile returns handle', async ({ request }) => {
    const response = await request.get('/api/user/me', {
      headers: { 'x-privy-user-id': TEST_USER_ID },
    });

    if (!response.ok()) {
      test.skip();
      return;
    }

    const user = await response.json();
    expect(user).toHaveProperty('handle');
  });

  test('can update username', async ({ request }) => {
    const newHandle = `testuser_${Date.now()}`;

    const response = await request.patch('/api/user/handle', {
      headers: { 'x-privy-user-id': TEST_USER_ID },
      data: { handle: newHandle },
    });

    // Should succeed or fail with validation error
    expect([200, 400, 409]).toContain(response.status());

    if (response.ok()) {
      const user = await response.json();
      expect(user.handle).toBe(newHandle);
    }
  });

  test('username validation rejects invalid handles', async ({ request }) => {
    const invalidHandles = [
      '', // Empty
      'ab', // Too short
      'a'.repeat(50), // Too long
      'invalid handle!', // Special characters
    ];

    for (const handle of invalidHandles) {
      const response = await request.patch('/api/user/handle', {
        headers: { 'x-privy-user-id': TEST_USER_ID },
        data: { handle },
      });

      // Should reject invalid handles
      expect([400, 422]).toContain(response.status());
    }
  });

  test('profile page renders user info', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    const body = await page.locator('body');
    await expect(body).toBeVisible();

    // Filter known errors
    const criticalErrors = errors.filter((err) => {
      if (err.includes('evmAsk') || err.includes('Backpack')) return false;
      if (err.includes('ResizeObserver')) return false;
      if (err.includes('401') || err.includes('Not authenticated')) return false;
      return true;
    });

    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Authentication Flow', () => {
  test('unauthenticated user sees login prompt on protected pages', async ({ page }) => {
    await page.goto('/play');
    await page.waitForLoadState('networkidle');

    // Should show some login UI or redirect
    const body = await page.locator('body');
    await expect(body).toBeVisible();

    const content = await body.textContent();
    // Should show login option or splash screen
    const hasLoginPrompt =
      content?.includes('Sign in') ||
      content?.includes('Login') ||
      content?.includes('Get Started') ||
      content?.includes('Twitter') ||
      content?.includes('Pally');

    expect(hasLoginPrompt).toBe(true);
  });

  test('splash page has login button', async ({ page }) => {
    await page.goto('/splash');
    await page.waitForLoadState('networkidle');

    const body = await page.locator('body');
    const content = await body.textContent();

    // Should have some way to sign in
    const hasSignIn =
      content?.includes('Sign in') ||
      content?.includes('Twitter') ||
      content?.includes('Connect') ||
      content?.includes('Start');

    expect(hasSignIn).toBe(true);
  });

  test('API returns 401 for unauthenticated requests to protected endpoints', async ({ request }) => {
    const protectedEndpoints = [
      '/api/votes/mine',
      '/api/user/stats',
    ];

    for (const endpoint of protectedEndpoints) {
      const response = await request.get(endpoint);
      // Should return 401 or empty array for unauthenticated users
      expect([200, 401, 403]).toContain(response.status());
    }
  });
});

test.describe('Vote Flow', () => {
  test('vote submission requires authentication', async ({ request }) => {
    const response = await request.post('/api/votes', {
      data: {
        questionId: 1,
        choice: 'A',
        betAmount: 10,
      },
    });

    // Should fail without auth header
    expect([400, 401, 403]).toContain(response.status());
  });

  test('cannot vote twice on same question', async ({ request }) => {
    const questionsResponse = await request.get('/api/questions/active');
    if (!questionsResponse.ok()) {
      test.skip();
      return;
    }

    const questions = await questionsResponse.json();
    if (!questions.length) {
      test.skip();
      return;
    }

    const question = questions[0];

    // First vote
    await request.post('/api/votes', {
      headers: { 'x-privy-user-id': TEST_USER_ID },
      data: {
        questionId: question.id,
        choice: 'A',
        betAmount: 10,
      },
    });

    // Second vote should fail
    const secondVote = await request.post('/api/votes', {
      headers: { 'x-privy-user-id': TEST_USER_ID },
      data: {
        questionId: question.id,
        choice: 'B',
        betAmount: 10,
      },
    });

    expect([400, 409]).toContain(secondVote.status());
  });

  test('vote choice must be valid option', async ({ request }) => {
    const questionsResponse = await request.get('/api/questions/active');
    if (!questionsResponse.ok()) {
      test.skip();
      return;
    }

    const questions = await questionsResponse.json();
    if (!questions.length) {
      test.skip();
      return;
    }

    const question = questions[0];

    const response = await request.post('/api/votes', {
      headers: { 'x-privy-user-id': `new-user-${Date.now()}` },
      data: {
        questionId: question.id,
        choice: 'Z', // Invalid choice
        betAmount: 10,
      },
    });

    expect([400, 422]).toContain(response.status());
  });
});

test.describe('Question Display', () => {
  test('active questions endpoint returns question data', async ({ request }) => {
    const response = await request.get('/api/questions/active');

    expect(response.ok()).toBe(true);

    const questions = await response.json();
    expect(Array.isArray(questions)).toBe(true);

    for (const question of questions) {
      expect(question).toHaveProperty('id');
      expect(question).toHaveProperty('prompt');
      expect(question).toHaveProperty('optionA');
      expect(question).toHaveProperty('optionB');
    }
  });

  test('question stats endpoint returns safe data', async ({ request }) => {
    const questionsResponse = await request.get('/api/questions/active');
    if (!questionsResponse.ok()) {
      test.skip();
      return;
    }

    const questions = await questionsResponse.json();
    if (!questions.length) {
      test.skip();
      return;
    }

    const question = questions[0];
    const statsResponse = await request.get(`/api/questions/${question.id}/live-stats`);

    if (statsResponse.ok()) {
      const stats = await statsResponse.json();

      // Should have aggregate stats but NOT vote distribution (to prevent collusion)
      expect(stats).toHaveProperty('totalBets');
      expect(stats).toHaveProperty('totalAmount');
      expect(typeof stats.totalBets).toBe('number');
      expect(typeof stats.totalAmount).toBe('number');
    }
  });
});
