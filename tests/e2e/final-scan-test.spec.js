const { test, expect } = require('@playwright/test');

test.describe('Real Vulnerability Scanner Testing', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(300000); // 5 minutes
    
    await page.goto('http://localhost:3000');
    
    // Handle login
    try {
      await page.waitForURL(/.*\/login/, { timeout: 5000 });
      await page.fill('input[type="email"]', 'demo@cyberguard.com');
      await page.fill('input[type="password"]', 'demo123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/dashboard/, { timeout: 20000 });
    } catch (e) {
      console.log('No login needed');
    }
  });

  test('should execute comprehensive real vulnerability scan', async ({ page }) => {
    console.log('🔍 Starting comprehensive real vulnerability scan test...');
    
    // Navigate using role-based selector to avoid duplicates
    await page.getByRole('button', { name: 'Vulnerability Scanner' }).first().click();
    await page.waitForURL(/.*\/vulnerability-scanner/);
    console.log('✓ Navigated to vulnerability scanner');
    
    // Check current vulnerability count
    await page.getByRole('button', { name: 'Dashboard' }).click();
    const initialCount = await page.locator('[data-testid="vulnerability-count"]').textContent();
    console.log('📊 Initial vulnerability count:', initialCount);
    
    // Return to scanner
    await page.getByRole('button', { name: 'Vulnerability Scanner' }).first().click();
    
    // Configure real localhost scan
    await page.fill('[data-testid="scan-target-input"]', '127.0.0.1');
    console.log('✓ Target: 127.0.0.1');
    
    // Select comprehensive scan type
    await page.locator('[data-testid="scan-type-select"]').click();
    await page.getByRole('option', { name: 'Comprehensive Scan' }).click();
    console.log('✓ Scan type: Comprehensive');
    
    // Start the real scan
    await page.getByRole('button', { name: 'Start Scan' }).click();
    console.log('🚀 Real network vulnerability scan initiated...');
    
    // Track real scan progress
    let realScanData = {
      started: false,
      progressCount: 0,
      maxProgress: 0,
      scanTime: 0,
      vulnerabilitiesFound: 0
    };
    
    const scanStartTime = Date.now();
    
    try {
      // Wait for scan to actually start
      await expect(page.locator('text=Scanning: 127.0.0.1')).toBeVisible({ timeout: 30000 });
      realScanData.started = true;
      console.log('✅ Real network scan started');
      
      // Monitor real progress
      let progressChecks = 0;
      const maxChecks = 60; // 3 minutes of checking
      
      while (progressChecks < maxChecks) {
        try {
          // Check if scan is still running
          const cancelButton = await page.locator('button:has-text("Cancel Scan")').isVisible({ timeout: 2000 });
          if (!cancelButton) {
            console.log('✅ Scan completed');
            break;
          }
          
          // Capture progress information
          try {
            const progressText = await page.locator('text=/\\d+%.*complete/i').textContent({ timeout: 1000 });
            const progressMatch = progressText.match(/(\d+)%/);
            if (progressMatch) {
              const currentProgress = parseInt(progressMatch[1]);
              realScanData.maxProgress = Math.max(realScanData.maxProgress, currentProgress);
              realScanData.progressCount++;
              if (realScanData.progressCount % 5 === 0) {
                console.log(`📈 Progress: ${currentProgress}%`);
              }
            }
          } catch (e) {
            // Progress text not visible, continue
          }
          
          await page.waitForTimeout(3000);
          progressChecks++;
          
        } catch (error) {
          break;
        }
      }
      
      // Final wait for completion
      await expect(page.getByRole('button', { name: 'Start Scan' })).toBeVisible({ timeout: 60000 });
      
      realScanData.scanTime = Date.now() - scanStartTime;
      console.log(`⏱️ Real scan completed in ${realScanData.scanTime / 1000}s`);
      
      // Check for scan results
      await expect(page.locator('[data-testid="scan-history-item"]').first()).toBeVisible({ timeout: 10000 });
      console.log('✓ Scan recorded in history');
      
      // Check dashboard updates
      await page.getByRole('button', { name: 'Dashboard' }).click();
      await page.waitForTimeout(3000); // Allow real-time updates
      
      const finalCount = await page.locator('[data-testid="vulnerability-count"]').textContent();
      const initialNum = parseInt(initialCount) || 0;
      const finalNum = parseInt(finalCount) || 0;
      realScanData.vulnerabilitiesFound = finalNum - initialNum;
      
      // Log comprehensive results
      console.log('\n🎯 REAL VULNERABILITY SCAN RESULTS:');
      console.log(`- Target: 127.0.0.1 (localhost)`);
      console.log(`- Scan Type: Comprehensive Network Scan`);
      console.log(`- Execution Time: ${realScanData.scanTime / 1000}s`);
      console.log(`- Progress Updates: ${realScanData.progressCount}`);
      console.log(`- Max Progress Reached: ${realScanData.maxProgress}%`);
      console.log(`- Vulnerabilities Found: ${realScanData.vulnerabilitiesFound}`);
      console.log(`- Before: ${initialNum}, After: ${finalNum}`);
      
      // Verify real scan executed
      expect(realScanData.started).toBeTruthy();
      expect(realScanData.scanTime).toBeGreaterThan(3000); // Real scans take time
      
      if (realScanData.vulnerabilitiesFound > 0) {
        console.log(`✅ SUCCESS: Discovered ${realScanData.vulnerabilitiesFound} real vulnerabilities via network scan`);
      } else {
        console.log('✅ SUCCESS: Network scan completed (secure target or filtered results)');
      }
      
      console.log('🔒 Real vulnerability scanning functionality verified');
      
    } catch (error) {
      console.error('❌ Real scan failed:', error.message);
      throw error;
    }
  });

  test('should handle external target real scanning', async ({ page }) => {
    console.log('🌐 Testing real external network scanning...');
    
    await page.getByRole('button', { name: 'Vulnerability Scanner' }).first().click();
    
    // Use external target (Google DNS - publicly scannable)
    await page.fill('[data-testid="scan-target-input"]', '8.8.8.8');
    await page.locator('[data-testid="scan-type-select"]').click();
    await page.getByRole('option', { name: 'Basic Scan' }).click();
    
    await page.getByRole('button', { name: 'Start Scan' }).click();
    console.log('🚀 External network scan started for 8.8.8.8');
    
    // Monitor external scan
    await expect(page.locator('text=Scanning: 8.8.8.8')).toBeVisible({ timeout: 20000 });
    console.log('✅ External network scan initiated');
    
    // Wait for completion (external may be faster due to filtering)
    await expect(page.getByRole('button', { name: 'Start Scan' })).toBeVisible({ timeout: 90000 });
    console.log('✅ External network scan completed');
    
    // Verify recorded
    await expect(page.locator('[data-testid="scan-history-item"]')).toBeVisible();
    console.log('✓ External scan results stored');
  });
});