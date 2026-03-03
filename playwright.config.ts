import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E rendering tests
 * Tests that the app renders correctly before deployment
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    // Base URL for tests - uses local dev server
    baseURL: 'http://localhost:5000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Serve built assets for rendering tests
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
    timeout: 30 * 1000,
  },
});
