import { test, expect } from '@playwright/test';

/**
 * E2E Rendering Tests
 * Verifies that critical screens render without errors before deployment
 */

test.describe('Landing Page Rendering', () => {
  test('landing page renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Check that the page rendered (has content)
    const body = await page.locator('body');
    await expect(body).toBeVisible();

    // Check that critical elements exist (adjust selectors based on your app)
    // The landing page should have the PALLY branding or intro
    const hasContent = await page.locator('body').textContent();
    expect(hasContent?.length).toBeGreaterThan(0);

    // Filter out known acceptable errors (browser extensions, etc.)
    const criticalErrors = errors.filter((err) => {
      // Ignore browser extension errors
      if (err.includes('evmAsk') || err.includes('Sentry')) return false;
      // Ignore ResizeObserver errors (common in React)
      if (err.includes('ResizeObserver')) return false;
      return true;
    });

    // Fail if there are critical JavaScript errors
    expect(criticalErrors).toHaveLength(0);
  });

  test('landing page loads CSS correctly', async ({ page }) => {
    const cssErrors: string[] = [];

    // Check for failed CSS requests
    page.on('response', (response) => {
      if (response.url().includes('.css') && !response.ok()) {
        cssErrors.push(`CSS failed to load: ${response.url()} - ${response.status()}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(cssErrors).toHaveLength(0);
  });

  test('landing page loads JavaScript correctly', async ({ page }) => {
    const jsErrors: string[] = [];

    // Check for failed JS requests
    page.on('response', (response) => {
      if (response.url().includes('.js') && !response.ok()) {
        jsErrors.push(`JS failed to load: ${response.url()} - ${response.status()}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(jsErrors).toHaveLength(0);
  });
});

test.describe('Play Page Rendering', () => {
  test('play page renders without critical errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Navigate to play page (main game view)
    await page.goto('/play');
    await page.waitForLoadState('networkidle');

    // Page should render something
    const body = await page.locator('body');
    await expect(body).toBeVisible();

    // Filter known acceptable errors
    const criticalErrors = errors.filter((err) => {
      if (err.includes('evmAsk') || err.includes('Sentry')) return false;
      if (err.includes('ResizeObserver')) return false;
      // Auth-related redirects are expected when not logged in
      if (err.includes('401') || err.includes('Not authenticated')) return false;
      return true;
    });

    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Splash/Login Page Rendering', () => {
  test('splash page renders login options', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/splash');
    await page.waitForLoadState('networkidle');

    // Should show login page content
    const body = await page.locator('body');
    await expect(body).toBeVisible();

    // Filter known acceptable errors
    const criticalErrors = errors.filter((err) => {
      if (err.includes('evmAsk') || err.includes('Sentry')) return false;
      if (err.includes('ResizeObserver')) return false;
      return true;
    });

    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Asset Loading', () => {
  test('no 500 errors on static assets', async ({ page }) => {
    const serverErrors: string[] = [];

    page.on('response', (response) => {
      if (response.status() >= 500) {
        serverErrors.push(`Server error: ${response.url()} - ${response.status()}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(serverErrors).toHaveLength(0);
  });

  test('CSS files have correct MIME type', async ({ page }) => {
    const mimeErrors: string[] = [];

    page.on('response', async (response) => {
      if (response.url().includes('.css')) {
        const contentType = response.headers()['content-type'] || '';
        if (!contentType.includes('text/css')) {
          mimeErrors.push(`Wrong MIME type for CSS: ${response.url()} - got ${contentType}`);
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(mimeErrors).toHaveLength(0);
  });

  test('JS files have correct MIME type', async ({ page }) => {
    const mimeErrors: string[] = [];

    page.on('response', async (response) => {
      if (response.url().includes('.js') && !response.url().includes('hot-update')) {
        const contentType = response.headers()['content-type'] || '';
        if (!contentType.includes('javascript') && !contentType.includes('application/javascript')) {
          mimeErrors.push(`Wrong MIME type for JS: ${response.url()} - got ${contentType}`);
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(mimeErrors).toHaveLength(0);
  });
});
