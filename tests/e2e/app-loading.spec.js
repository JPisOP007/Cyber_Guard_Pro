const { test, expect } = require('@playwright/test');

test.describe('App Loading', () => {
  test('should load the application and show navigation', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log('Browser:', msg.text()));
    page.on('pageerror', err => console.log('Page Error:', err.message));
    
    console.log('Navigating to app...');
    await page.goto('http://localhost:3000', { timeout: 60000 });
    
    // Wait for app to load
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'app-loaded.png', fullPage: true });
    
    // Check if the app loaded
    console.log('Page title:', await page.title());
    console.log('Current URL:', page.url());
    
    // Look for any visible content
    const bodyText = await page.locator('body').textContent();
    console.log('Body content length:', bodyText.length);
    console.log('First 200 chars of body:', bodyText.substring(0, 200));
    
    // Check for common elements
    const hasHeader = await page.locator('header').count();
    const hasNav = await page.locator('nav').count();
    const hasSidebar = await page.locator('[role="navigation"]').count();
    const hasMain = await page.locator('main').count();
    
    console.log('Elements found - Header:', hasHeader, 'Nav:', hasNav, 'Sidebar:', hasSidebar, 'Main:', hasMain);
    
    // Look for navigation items
    const navItems = await page.locator('text=Dashboard, text=Vulnerability Scanner, text=Threat Monitor').count();
    console.log('Navigation items found:', navItems);
    
    // Look for any links containing vulnerability scanner
    const vulnLinks = await page.locator('a:has-text("Vulnerability"), text=Vulnerability Scanner').count();
    console.log('Vulnerability scanner links found:', vulnLinks);
    
    // Try to find the navigation menu
    const menuItems = await page.locator('[role="menuitem"], .MuiListItem-root, .menu-item').count();
    console.log('Menu items found:', menuItems);
    
    // Check if the page has any interactive elements
    const buttons = await page.locator('button').count();
    const links = await page.locator('a').count();
    console.log('Interactive elements - Buttons:', buttons, 'Links:', links);
    
    expect(bodyText.length).toBeGreaterThan(100);
  });
});