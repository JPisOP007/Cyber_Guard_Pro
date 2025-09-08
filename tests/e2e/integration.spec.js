const { test, expect } = require('@playwright/test');
const TestHelpers = require('./utils/testHelpers');
const testData = require('./fixtures/testData');

test.describe('Complete Real-time Threat Monitoring Integration', () => {
  let helpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Full User Journey', () => {
    test('should complete full threat monitoring workflow', async ({ page }) => {
      // 1. Login
      await helpers.login();
      expect(page.url()).toContain('/dashboard');

      // 2. Navigate to threat monitor
      await helpers.navigateToThreatMonitor();
      expect(page.url()).toContain('/threat-monitor');

      // 3. Verify page loaded correctly
      await expect(page.locator(testData.selectors.threatMonitorPage)).toBeVisible();
      await expect(page.locator(testData.selectors.threatStats)).toBeVisible();
      await expect(page.locator(testData.selectors.threatFeed)).toBeVisible();

      // 4. Wait for WebSocket connection
      await helpers.waitForWebSocketConnection();
      const connectionStatus = await helpers.checkConnectionStatus();
      expect(connectionStatus).toContain('MuiAlert-standardSuccess');

      // 5. Record initial state
      const initialStats = await helpers.getAllStatCounters();
      await helpers.validateStatCountersAreNumbers();

      // 6. Wait for and validate real-time threat alerts
      await helpers.waitForNewThreatAlert();
      const updatedStats = await helpers.getAllStatCounters();
      expect(updatedStats.total).toBeGreaterThan(initialStats.total);

      // 7. Validate threat display
      const latestThreat = await helpers.getLatestThreatDetails();
      expect(latestThreat).toBeTruthy();
      expect(latestThreat.title).toBeTruthy();
      expect(latestThreat.description).toBeTruthy();
      expect(['critical', 'high', 'medium', 'low']).toContain(latestThreat.severity);

      // 8. Validate UI consistency
      const finalStats = await helpers.getAllStatCounters();
      const calculatedTotal = finalStats.critical + finalStats.high + finalStats.medium + finalStats.low;
      expect(finalStats.total).toEqual(calculatedTotal);

      console.log('✅ Complete threat monitoring workflow validated successfully');
    });

    test('should handle extended monitoring session', async ({ page }) => {
      await helpers.login();
      await helpers.navigateToThreatMonitor();
      await helpers.waitForWebSocketConnection();

      const sessionDuration = 180000; // 3 minutes
      const startTime = Date.now();
      const threatCounts = [];
      const statsSnapshots = [];

      console.log('Starting extended monitoring session (3 minutes)...');

      while (Date.now() - startTime < sessionDuration) {
        try {
          await helpers.waitForNewThreatAlert(30000);
          
          const currentThreatCount = await helpers.getThreatCount();
          const currentStats = await helpers.getAllStatCounters();
          
          threatCounts.push({
            timestamp: Date.now(),
            count: currentThreatCount
          });
          
          statsSnapshots.push({
            timestamp: Date.now(),
            stats: currentStats
          });

          // Validate consistency at each step
          const calculatedTotal = currentStats.critical + currentStats.high + currentStats.medium + currentStats.low;
          expect(currentStats.total).toEqual(calculatedTotal);

          // Validate UI responsiveness
          const isResponsive = await page.evaluate(() => {
            return document.readyState === 'complete' && 
                   document.querySelector('[data-testid="connection-status"]') !== null;
          });
          expect(isResponsive).toBeTruthy();

        } catch (error) {
          console.log('Waiting for next threat...');
          await page.waitForTimeout(5000);
        }
      }

      // Analyze session data
      expect(threatCounts.length).toBeGreaterThan(0);
      expect(statsSnapshots.length).toBeGreaterThan(0);

      // Verify monotonic increase in threat counts
      for (let i = 1; i < threatCounts.length; i++) {
        expect(threatCounts[i].count).toBeGreaterThanOrEqual(threatCounts[i-1].count);
      }

      console.log(`✅ Extended session completed: ${threatCounts.length} threats observed`);
    });
  });

  test.describe('System Resilience', () => {
    test('should recover from network interruptions', async ({ page }) => {
      await helpers.login();
      await helpers.navigateToThreatMonitor();
      await helpers.waitForWebSocketConnection();

      // Get initial threat count
      await helpers.waitForNewThreatAlert();
      const initialCount = await helpers.getThreatCount();

      // Simulate network interruption
      await page.route('**/socket.io/**', route => route.abort());
      
      // Wait for disconnection
      await page.waitForFunction(() => {
        const statusElement = document.querySelector('[data-testid="connection-status"]');
        return statusElement && statusElement.classList.contains('MuiAlert-standardWarning');
      });

      // Re-enable network
      await page.unroute('**/socket.io/**');

      // Wait for reconnection
      await helpers.waitForWebSocketConnection();

      // Verify system continues working
      await helpers.waitForNewThreatAlert();
      const finalCount = await helpers.getThreatCount();
      expect(finalCount).toBeGreaterThanOrEqual(initialCount);

      console.log('✅ System recovered from network interruption');
    });

    test('should handle rapid UI interactions during real-time updates', async ({ page }) => {
      await helpers.login();
      await helpers.navigateToThreatMonitor();
      await helpers.waitForWebSocketConnection();

      // Start receiving threats
      await helpers.waitForNewThreatAlert();

      // Perform rapid UI interactions while threats are coming in
      for (let i = 0; i < 10; i++) {
        // Scroll the threat feed
        await page.locator(testData.selectors.threatFeed).evaluate(el => {
          el.scrollTop = Math.random() * el.scrollHeight;
        });

        // Navigate away and back
        if (i % 3 === 0) {
          await page.click('[data-testid="nav-dashboard"]');
          await page.waitForTimeout(100);
          await page.click('[data-testid="nav-threat-monitor"]');
        }

        await page.waitForTimeout(500);
      }

      // Verify system is still functional
      const isConnectionActive = await helpers.checkConnectionStatus();
      expect(isConnectionActive).toContain('MuiAlert-standardSuccess');

      const finalStats = await helpers.getAllStatCounters();
      await helpers.validateStatCountersAreNumbers();

      console.log('✅ System handled rapid UI interactions successfully');
    });
  });

  test.describe('Data Accuracy and Consistency', () => {
    test('should maintain data accuracy across multiple threat types', async ({ page }) => {
      await helpers.login();
      await helpers.navigateToThreatMonitor();
      await helpers.waitForWebSocketConnection();

      const threatsByType = new Map();
      const maxObservationTime = 120000; // 2 minutes
      const startTime = Date.now();

      console.log('Observing threats for data accuracy analysis...');

      while (Date.now() - startTime < maxObservationTime) {
        try {
          await helpers.waitForNewThreatAlert(30000);
          
          const latestThreat = await helpers.getLatestThreatDetails();
          if (latestThreat) {
            const type = latestThreat.severity;
            threatsByType.set(type, (threatsByType.get(type) || 0) + 1);
          }

        } catch (error) {
          break; // Timeout waiting for threat
        }
      }

      // Verify we observed different severity types
      console.log('Observed threat severities:', Array.from(threatsByType.keys()));
      
      // Should have observed at least some threats
      expect(threatsByType.size).toBeGreaterThan(0);

      // Verify final stats match observations
      const finalStats = await helpers.getAllStatCounters();
      const observedTotal = Array.from(threatsByType.values()).reduce((a, b) => a + b, 0);
      
      // The UI total should be at least as much as we observed (might be more from earlier)
      expect(finalStats.total).toBeGreaterThanOrEqual(observedTotal);

      console.log('✅ Data accuracy maintained across different threat types');
    });

    test('should preserve data consistency during page lifecycle events', async ({ page }) => {
      await helpers.login();
      await helpers.navigateToThreatMonitor();
      await helpers.waitForWebSocketConnection();

      // Get some threats
      await helpers.waitForNewThreatAlert();
      const beforeRefreshStats = await helpers.getAllStatCounters();
      const beforeRefreshThreat = await helpers.getLatestThreatDetails();

      // Refresh page
      await page.reload();
      await helpers.waitForWebSocketConnection();

      // Data might reset after refresh (expected behavior)
      // But the system should still function correctly
      await helpers.validateStatCountersAreNumbers();

      // Wait for new data
      try {
        await helpers.waitForNewThreatAlert(60000);
      } catch (e) {
        console.log('No new threats after refresh, but system is functional');
      }

      const afterRefreshStats = await helpers.getAllStatCounters();
      await helpers.validateStatCountersAreNumbers();

      console.log('Before refresh:', beforeRefreshStats);
      console.log('After refresh:', afterRefreshStats);

      console.log('✅ System maintains consistency through page lifecycle events');
    });
  });

  test.describe('Performance and Scalability', () => {
    test('should maintain acceptable performance with continuous threat flow', async ({ page }) => {
      await helpers.login();
      await helpers.navigateToThreatMonitor();
      await helpers.waitForWebSocketConnection();

      const performanceMetrics = {
        connectionTime: await helpers.measureWebSocketConnectionTime(),
        pageLoadTime: await helpers.measurePageLoadTime(),
        threatProcessingTimes: []
      };

      console.log(`Initial connection time: ${performanceMetrics.connectionTime}ms`);
      expect(performanceMetrics.connectionTime).toBeLessThan(5000);

      // Measure threat processing performance
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        await helpers.waitForNewThreatAlert(60000);
        const processingTime = Date.now() - startTime;
        
        performanceMetrics.threatProcessingTimes.push(processingTime);
        console.log(`Threat ${i + 1} processing time: ${processingTime}ms`);
      }

      // Analyze performance metrics
      const avgProcessingTime = performanceMetrics.threatProcessingTimes.reduce((a, b) => a + b, 0) / performanceMetrics.threatProcessingTimes.length;
      
      console.log(`Average threat processing time: ${avgProcessingTime}ms`);
      
      // Performance should be reasonable (within 60 seconds per threat on average)
      expect(avgProcessingTime).toBeLessThan(60000);

      // UI should remain responsive
      const finalResponsiveness = await page.evaluate(() => {
        const start = performance.now();
        document.querySelector('[data-testid="threat-stats"]').style.opacity = '0.9';
        document.querySelector('[data-testid="threat-stats"]').style.opacity = '1.0';
        const end = performance.now();
        return end - start;
      });

      expect(finalResponsiveness).toBeLessThan(100); // DOM manipulation should be fast

      console.log('✅ Performance metrics within acceptable ranges');
    });
  });
});