const { test, expect } = require('@playwright/test');

test.describe('Basic Vulnerability Scan', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await expect(page).toHaveTitle(/CyberGuard Pro/);
  });

  test('should complete a localhost vulnerability scan and update dashboard', async ({ page }) => {
    console.log('Starting basic vulnerability scan test...');
    
    // Navigate to vulnerability scanner
    await page.click('text=Vulnerability Scanner');
    await expect(page.locator('h1:has-text("Vulnerability Scanner")')).toBeVisible();
    
    // Fill scan configuration
    await page.fill('[data-testid="scan-target-input"]', '127.0.0.1');
    await page.selectOption('[data-testid="scan-type-select"]', 'basic');
    
    // Get initial dashboard state
    await page.click('text=Dashboard');
    await expect(page.locator('[data-testid="vulnerability-count"]')).toBeVisible();
    const initialCount = await page.locator('[data-testid="vulnerability-count"]').textContent();
    console.log('Initial vulnerability count:', initialCount);
    
    // Go back to scanner and start scan
    await page.click('text=Vulnerability Scanner');
    await page.getByRole('button', { name: /start scan/i }).click();
    
    // Wait for scan to start
    await expect(page.locator('text=Scanning: 127.0.0.1')).toBeVisible({ timeout: 15000 });
    console.log('Scan started successfully');
    
    // Monitor progress
    await expect(page.locator('.MuiLinearProgress-root')).toBeVisible();
    console.log('Progress bar visible');
    
    // Wait for scan completion (allow up to 2 minutes for real scan)
    await expect(page.getByRole('button', { name: /start scan/i })).toBeVisible({ timeout: 120000 });
    console.log('Scan completed');
    
    // Check that scan appears in history
    await expect(page.locator('[data-testid="scan-history-item"]')).toBeVisible({ timeout: 10000 });
    console.log('Scan appears in history');
    
    // Navigate back to dashboard and verify update
    await page.click('text=Dashboard');
    await page.waitForTimeout(3000); // Allow dashboard to refresh
    
    const finalCount = await page.locator('[data-testid="vulnerability-count"]').textContent();
    console.log('Final vulnerability count:', finalCount);
    
    // The count should either increase or stay the same (if no vulnerabilities found)
    expect(parseInt(finalCount) >= parseInt(initialCount)).toBeTruthy();
  });
});