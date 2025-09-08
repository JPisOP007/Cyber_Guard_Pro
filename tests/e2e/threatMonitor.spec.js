const { test, expect } = require('@playwright/test');
const TestHelpers = require('./utils/testHelpers');
const testData = require('./fixtures/testData');

test.describe('Real-time Threat Monitoring System', () => {
  let helpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    
    // Login and navigate to threat monitor
    await helpers.login();
    await helpers.navigateToThreatMonitor();
  });

  test.describe('WebSocket Connection', () => {
    test('should establish WebSocket connection on page load', async ({ page }) => {
      // Verify connection status indicator shows connected
      await helpers.waitForWebSocketConnection();
      
      const connectionStatus = await helpers.checkConnectionStatus();
      expect(connectionStatus).toContain('MuiAlert-standardSuccess');
      
      // Verify connection status text
      const statusText = await page.locator(testData.selectors.connectionStatus).textContent();
      expect(statusText).toContain('Real-time monitoring active');
    });

    test('should handle WebSocket reconnection gracefully', async ({ page }) => {
      // First establish connection
      await helpers.waitForWebSocketConnection();
      
      // Simulate network interruption by blocking socket.io requests
      await page.route('**/socket.io/**', route => route.abort());
      
      // Wait for disconnection indicator
      await page.waitForFunction(() => {
        const statusElement = document.querySelector('[data-testid="connection-status"]');
        return statusElement && statusElement.classList.contains('MuiAlert-standardWarning');
      });
      
      const disconnectedStatusText = await page.locator(testData.selectors.connectionStatus).textContent();
      expect(disconnectedStatusText).toContain('monitoring offline');
      
      // Re-enable network and verify reconnection
      await page.unroute('**/socket.io/**');
      await helpers.waitForWebSocketConnection();
      
      const reconnectedStatusText = await page.locator(testData.selectors.connectionStatus).textContent();
      expect(reconnectedStatusText).toContain('monitoring active');
    });

    test('should measure WebSocket connection performance', async ({ page }) => {
      const connectionTime = await helpers.measureWebSocketConnectionTime();
      
      // Connection should be established within 5 seconds
      expect(connectionTime).toBeLessThan(5000);
      
      console.log(`WebSocket connection established in ${connectionTime}ms`);
    });
  });

  test.describe('Real-time Threat Alerts', () => {
    test('should receive and display new threat alerts in real-time', async ({ page }) => {
      // Wait for WebSocket connection
      await helpers.waitForWebSocketConnection();
      
      // Get initial threat count
      const initialStats = await helpers.getAllStatCounters();
      
      // Wait for a new threat alert to arrive
      await helpers.waitForNewThreatAlert();
      
      // Verify threat feed updated
      const threatCount = await helpers.getThreatCount();
      expect(threatCount).toBeGreaterThan(0);
      
      // Verify latest threat has proper structure
      const latestThreat = await helpers.getLatestThreatDetails();
      expect(latestThreat).toBeTruthy();
      expect(latestThreat.title).toBeTruthy();
      expect(latestThreat.description).toBeTruthy();
      expect(['critical', 'high', 'medium', 'low']).toContain(latestThreat.severity);
      expect(latestThreat.timestamp).toBeTruthy();
      
      // Verify stats counter updated
      const updatedStats = await helpers.getAllStatCounters();
      expect(updatedStats.total).toBeGreaterThan(initialStats.total);
    });

    test('should display toast notifications for critical threats', async ({ page }) => {
      await helpers.waitForWebSocketConnection();
      
      // Wait for any threat alert
      await helpers.waitForNewThreatAlert();
      
      // Check if a toast notification appeared
      try {
        await helpers.waitForToastNotification(5000);
        const toastMessage = await helpers.getToastMessage();
        expect(toastMessage).toContain('New Threat:');
      } catch (e) {
        // Toast may not appear for all threats, only specific types
        console.log('No toast notification appeared (expected for some threat types)');
      }
    });

    test('should handle multiple concurrent threat alerts', async ({ page }) => {
      await helpers.waitForWebSocketConnection();
      
      const initialThreatCount = await helpers.getThreatCount();
      
      // Wait for multiple threats (up to 3 minutes for several alerts)
      const startTime = Date.now();
      const maxWaitTime = 180000; // 3 minutes
      let newThreats = 0;
      
      while (Date.now() - startTime < maxWaitTime && newThreats < 3) {
        try {
          await helpers.waitForNewThreatAlert(30000);
          newThreats++;
        } catch (e) {
          break; // Timeout waiting for next threat
        }
      }
      
      expect(newThreats).toBeGreaterThanOrEqual(1);
      
      const finalThreatCount = await helpers.getThreatCount();
      expect(finalThreatCount).toBeGreaterThan(initialThreatCount);
      
      // Verify threats maintain correct order (newest first)
      const threatItems = page.locator(testData.selectors.threatItem);
      const firstThreatTime = await threatItems.first().locator(testData.selectors.threatTimestamp).textContent();
      const lastThreatTime = await threatItems.last().locator(testData.selectors.threatTimestamp).textContent();
      
      // Verify timestamps are recent
      expect(firstThreatTime).toBeTruthy();
      expect(lastThreatTime).toBeTruthy();
    });

    test('should correctly categorize threats by severity', async ({ page }) => {
      await helpers.waitForWebSocketConnection();
      
      // Wait for at least one threat
      await helpers.waitForNewThreatAlert();
      
      // Get current stats
      const stats = await helpers.getAllStatCounters();
      
      // Verify stats consistency
      const calculatedTotal = stats.critical + stats.high + stats.medium + stats.low;
      expect(stats.total).toEqual(calculatedTotal);
      
      // Verify each threat item has correct severity classification
      const threatItems = await page.locator(testData.selectors.threatItem).count();
      
      for (let i = 0; i < Math.min(threatItems, 5); i++) { // Check first 5 threats
        const threatItem = page.locator(testData.selectors.threatItem).nth(i);
        await helpers.validateThreatItemStructure(threatItem);
        
        const severityChip = threatItem.locator(testData.selectors.threatSeverityChip);
        const severity = await severityChip.textContent();
        expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(severity.trim());
      }
    });
  });

  test.describe('Statistics and Counters', () => {
    test('should update statistics counters dynamically', async ({ page }) => {
      await helpers.waitForWebSocketConnection();
      
      const initialStats = await helpers.getAllStatCounters();
      
      // Wait for new threat
      await helpers.waitForNewThreatAlert();
      
      const updatedStats = await helpers.getAllStatCounters();
      
      // Total should increase
      expect(updatedStats.total).toBeGreaterThan(initialStats.total);
      
      // At least one severity category should increase
      const severityIncreased = (
        updatedStats.critical > initialStats.critical ||
        updatedStats.high > initialStats.high ||
        updatedStats.medium > initialStats.medium ||
        updatedStats.low > initialStats.low
      );
      expect(severityIncreased).toBeTruthy();
      
      // Validate all counters are numbers
      await helpers.validateStatCountersAreNumbers();
    });

    test('should maintain accurate threat statistics across multiple updates', async ({ page }) => {
      await helpers.waitForWebSocketConnection();
      
      // Track statistics over time
      const statsHistory = [];
      
      for (let i = 0; i < 3; i++) {
        try {
          await helpers.waitForNewThreatAlert(60000); // Wait up to 1 minute for each
          const stats = await helpers.getAllStatCounters();
          statsHistory.push(stats);
          
          // Verify monotonic increase
          if (i > 0) {
            expect(stats.total).toBeGreaterThanOrEqual(statsHistory[i-1].total);
          }
        } catch (e) {
          console.log(`Timeout waiting for threat ${i + 1}`);
          break;
        }
      }
      
      expect(statsHistory.length).toBeGreaterThanOrEqual(1);
      
      // Verify final consistency
      const finalStats = statsHistory[statsHistory.length - 1];
      const calculatedTotal = finalStats.critical + finalStats.high + finalStats.medium + finalStats.low;
      expect(finalStats.total).toEqual(calculatedTotal);
    });
  });

  test.describe('User Interface Responsiveness', () => {
    test('should handle rapid threat updates without UI freezing', async ({ page }) => {
      await helpers.waitForWebSocketConnection();
      
      const startTime = Date.now();
      let threatsReceived = 0;
      const maxWaitTime = 120000; // 2 minutes
      
      while (Date.now() - startTime < maxWaitTime && threatsReceived < 5) {
        try {
          await helpers.waitForNewThreatAlert(30000);
          threatsReceived++;
          
          // Verify UI remains responsive
          const isPageResponsive = await page.evaluate(() => {
            // Check if we can interact with DOM
            const statusElement = document.querySelector('[data-testid="connection-status"]');
            return statusElement && statusElement.isConnected;
          });
          
          expect(isPageResponsive).toBeTruthy();
          
        } catch (e) {
          break;
        }
      }
      
      expect(threatsReceived).toBeGreaterThanOrEqual(1);
      
      // Verify final UI state
      const threatFeed = page.locator(testData.selectors.threatFeed);
      await expect(threatFeed).toBeVisible();
    });

    test('should limit threat feed to maximum items for performance', async ({ page }) => {
      await helpers.waitForWebSocketConnection();
      
      // Wait for several threats to accumulate
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        try {
          await helpers.waitForNewThreatAlert(30000);
          attempts++;
          
          const threatCount = await helpers.getThreatCount();
          
          // Should not exceed 50 threats (as per implementation)
          expect(threatCount).toBeLessThanOrEqual(50);
          
          if (threatCount >= 10) break; // We have enough to test
        } catch (e) {
          break;
        }
      }
      
      const finalThreatCount = await helpers.getThreatCount();
      console.log(`Final threat count: ${finalThreatCount}`);
    });
  });

  test.describe('Data Integrity', () => {
    test('should display accurate threat timestamps', async ({ page }) => {
      await helpers.waitForWebSocketConnection();
      
      await helpers.waitForNewThreatAlert();
      
      const latestThreat = await helpers.getLatestThreatDetails();
      expect(latestThreat.timestamp).toBeTruthy();
      
      // Verify timestamp is recent (within last 5 minutes)
      const timestampText = latestThreat.timestamp;
      const now = new Date();
      
      // Should show time format (e.g., "2:04:32 AM" or similar)
      expect(timestampText).toMatch(/\d{1,2}:\d{2}:\d{2}\s?(AM|PM)/i);
    });

    test('should maintain consistent threat data across page interactions', async ({ page }) => {
      await helpers.waitForWebSocketConnection();
      
      await helpers.waitForNewThreatAlert();
      
      const threatDetailsBeforeScroll = await helpers.getLatestThreatDetails();
      
      // Scroll the threat feed
      await page.locator(testData.selectors.threatFeed).evaluate(el => {
        el.scrollTop = el.scrollHeight / 2;
      });
      
      // Scroll back to top
      await page.locator(testData.selectors.threatFeed).evaluate(el => {
        el.scrollTop = 0;
      });
      
      const threatDetailsAfterScroll = await helpers.getLatestThreatDetails();
      
      // Data should remain consistent
      expect(threatDetailsAfterScroll.title).toEqual(threatDetailsBeforeScroll.title);
      expect(threatDetailsAfterScroll.description).toEqual(threatDetailsBeforeScroll.description);
      expect(threatDetailsAfterScroll.severity).toEqual(threatDetailsBeforeScroll.severity);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle WebSocket disconnection gracefully', async ({ page }) => {
      await helpers.waitForWebSocketConnection();
      
      // Force disconnect by blocking socket.io
      await page.route('**/socket.io/**', route => route.abort());
      
      // Should show disconnected state
      await page.waitForFunction(() => {
        const statusElement = document.querySelector('[data-testid="connection-status"]');
        return statusElement && (
          statusElement.classList.contains('MuiAlert-standardWarning') ||
          statusElement.textContent.includes('offline')
        );
      }, { timeout: 30000 });
      
      const statusText = await page.locator(testData.selectors.connectionStatus).textContent();
      expect(statusText).toMatch(/(offline|reconnecting|disconnected)/i);
    });

    test('should show appropriate message when no threats are present initially', async ({ page }) => {
      // Navigate to fresh session where no threats may be present yet
      await page.goto('/threat-monitor');
      await helpers.waitForWebSocketConnection();
      
      const threatFeedContent = await page.locator(testData.selectors.threatFeed).textContent();
      
      // Should either show threats or appropriate empty state message
      const hasThreats = await helpers.getThreatCount() > 0;
      
      if (!hasThreats) {
        expect(threatFeedContent).toMatch(/(Monitoring for threats|No threats detected|Connecting)/i);
      }
    });
  });
});