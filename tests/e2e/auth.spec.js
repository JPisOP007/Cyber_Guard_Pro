const { test, expect } = require('@playwright/test');
const TestHelpers = require('./utils/testHelpers');
const testData = require('./fixtures/testData');

test.describe('Authentication and Navigation', () => {
  let helpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Login Flow', () => {
    test('should display login form correctly', async ({ page }) => {
      await page.goto('/login');
      
      // Check for login form elements
      await expect(page.locator(testData.selectors.loginForm)).toBeVisible();
      await expect(page.locator(testData.selectors.emailInput)).toBeVisible();
      await expect(page.locator(testData.selectors.passwordInput)).toBeVisible();
      await expect(page.locator(testData.selectors.loginButton)).toBeVisible();
      
      // Check page title
      expect(await page.textContent('h1')).toContain('CyberGuard Pro');
    });

    test('should validate form inputs', async ({ page }) => {
      await page.goto('/login');
      
      // Try to submit empty form
      await page.click(testData.selectors.loginButton);
      
      // Should show validation errors
      const emailError = page.locator(testData.selectors.emailInput).locator('..').locator('p');
      const passwordError = page.locator(testData.selectors.passwordInput).locator('..').locator('p');
      
      await expect(emailError).toContainText('Email is required');
      await expect(passwordError).toContainText('Password is required');
    });

    test('should successfully login with demo credentials', async ({ page }) => {
      await page.goto('/login');
      
      // Use demo credentials
      await page.fill(testData.selectors.emailInput, 'demo@cyberguard.com');
      await page.fill(testData.selectors.passwordInput, 'demo123');
      await page.click(testData.selectors.loginButton);
      
      // Should redirect to dashboard
      await page.waitForURL('/dashboard');
      expect(page.url()).toContain('/dashboard');
    });

    test('should handle invalid credentials gracefully', async ({ page }) => {
      await page.goto('/login');
      
      await page.fill(testData.selectors.emailInput, 'invalid@example.com');
      await page.fill(testData.selectors.passwordInput, 'wrongpassword');
      await page.click(testData.selectors.loginButton);
      
      // Should show error message (implementation dependent)
      // This might be shown as a toast or alert
      await page.waitForTimeout(2000); // Allow time for error to appear
    });
  });

  test.describe('Navigation Flow', () => {
    test('should navigate to threat monitor from dashboard', async ({ page }) => {
      // Login first
      await helpers.login();
      
      // Should be on dashboard
      expect(page.url()).toContain('/dashboard');
      
      // Navigate to threat monitor
      await page.click(testData.selectors.threatMonitorLink);
      
      // Should be on threat monitor page
      await page.waitForURL('/threat-monitor');
      expect(page.url()).toContain('/threat-monitor');
      
      // Should show threat monitor content
      await expect(page.locator(testData.selectors.threatMonitorPage)).toBeVisible();
    });

    test('should show sidebar navigation', async ({ page }) => {
      await helpers.login();
      
      // Sidebar should be visible
      await expect(page.locator(testData.selectors.sidebar)).toBeVisible();
      
      // Check navigation links are present
      await expect(page.locator(testData.selectors.threatMonitorLink)).toBeVisible();
      
      // Check CyberGuard Pro logo/title
      expect(await page.textContent(testData.selectors.sidebar)).toContain('CyberGuard Pro');
    });

    test('should maintain authentication across page refreshes', async ({ page }) => {
      await helpers.login();
      
      // Refresh the page
      await page.reload();
      
      // Should still be authenticated and on dashboard
      await page.waitForURL('/dashboard');
      expect(page.url()).toContain('/dashboard');
    });
  });

  test.describe('Authentication Integration with Real-time Features', () => {
    test('should establish WebSocket connection after login', async ({ page }) => {
      await helpers.login();
      await helpers.navigateToThreatMonitor();
      
      // WebSocket should connect automatically
      await helpers.waitForWebSocketConnection();
      
      const connectionStatus = await helpers.checkConnectionStatus();
      expect(connectionStatus).toContain('MuiAlert-standardSuccess');
    });

    test('should maintain WebSocket connection during navigation', async ({ page }) => {
      await helpers.login();
      await helpers.navigateToThreatMonitor();
      
      // Establish connection
      await helpers.waitForWebSocketConnection();
      
      // Navigate away and back
      await page.click('[data-testid="nav-dashboard"]');
      await page.waitForURL('/dashboard');
      
      await helpers.navigateToThreatMonitor();
      
      // Connection should still be active or quickly re-establish
      await helpers.waitForWebSocketConnection();
      
      const connectionStatus = await helpers.checkConnectionStatus();
      expect(connectionStatus).toContain('MuiAlert-standardSuccess');
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access protected route directly
      await page.goto('/threat-monitor');
      
      // Should redirect to login
      await page.waitForURL('/login');
      expect(page.url()).toContain('/login');
    });

    test('should redirect authenticated users away from login', async ({ page }) => {
      await helpers.login();
      
      // Try to access login page when authenticated
      await page.goto('/login');
      
      // Should redirect to dashboard
      await page.waitForURL('/dashboard');
      expect(page.url()).toContain('/dashboard');
    });
  });
});