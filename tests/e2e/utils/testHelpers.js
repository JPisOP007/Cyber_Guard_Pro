const { expect } = require('@playwright/test');
const testData = require('../fixtures/testData');

class TestHelpers {
  constructor(page) {
    this.page = page;
  }

  // Authentication helpers
  async login(userCredentials = testData.testUser) {
    await this.page.goto('/login');
    
    await this.page.fill(testData.selectors.emailInput, userCredentials.email);
    await this.page.fill(testData.selectors.passwordInput, userCredentials.password);
    await this.page.click(testData.selectors.loginButton);
    
    // Wait for successful login redirect
    await this.page.waitForURL('/dashboard');
  }

  async navigateToThreatMonitor() {
    await this.page.click(testData.selectors.threatMonitorLink);
    await this.page.waitForURL('/threat-monitor');
    await this.page.waitForSelector(testData.selectors.threatMonitorPage);
  }

  // WebSocket connection helpers
  async waitForWebSocketConnection() {
    // Wait for connection status to show connected
    await this.page.waitForSelector(testData.selectors.connectionStatus);
    
    // Wait for the status to be "success" (connected)
    await this.page.waitForFunction(() => {
      const statusElement = document.querySelector('[data-testid="connection-status"]');
      return statusElement && statusElement.classList.contains('MuiAlert-standardSuccess');
    });
  }

  async checkConnectionStatus() {
    const connectionAlert = this.page.locator(testData.selectors.connectionStatus);
    return await connectionAlert.getAttribute('class');
  }

  // Threat monitoring helpers
  async waitForNewThreatAlert(timeout = 30000) {
    // Wait for a new threat item to appear in the feed
    const initialCount = await this.getThreatCount();
    
    await this.page.waitForFunction((expectedCount) => {
      const threatItems = document.querySelectorAll('[data-testid="threat-item"]');
      return threatItems.length > expectedCount;
    }, initialCount, { timeout });
  }

  async getThreatCount() {
    const threatItems = await this.page.locator(testData.selectors.threatItem).count();
    return threatItems;
  }

  async getStatCounter(counterSelector) {
    const counter = this.page.locator(counterSelector);
    const text = await counter.textContent();
    return parseInt(text) || 0;
  }

  async getAllStatCounters() {
    return {
      total: await this.getStatCounter(testData.selectors.totalThreatsCounter),
      critical: await this.getStatCounter(testData.selectors.criticalThreatsCounter),
      high: await this.getStatCounter(testData.selectors.highThreatsCounter),
      medium: await this.getStatCounter(testData.selectors.mediumThreatsCounter),
      low: await this.getStatCounter(testData.selectors.lowThreatsCounter),
    };
  }

  async getLatestThreatDetails() {
    const firstThreatItem = this.page.locator(testData.selectors.threatItem).first();
    
    if (await firstThreatItem.count() === 0) {
      return null;
    }

    const title = await firstThreatItem.locator(testData.selectors.threatTitle).textContent();
    const description = await firstThreatItem.locator(testData.selectors.threatDescription).textContent();
    const severityChip = firstThreatItem.locator(testData.selectors.threatSeverityChip);
    const severity = await severityChip.textContent();
    const timestamp = await firstThreatItem.locator(testData.selectors.threatTimestamp).textContent();

    return {
      title: title?.trim(),
      description: description?.trim(),
      severity: severity?.trim().toLowerCase(),
      timestamp: timestamp?.trim()
    };
  }

  // Toast notification helpers
  async waitForToastNotification(timeout = 10000) {
    await this.page.waitForSelector(testData.selectors.toastNotification, { timeout });
  }

  async getToastMessage() {
    const toast = this.page.locator(testData.selectors.toastMessage).first();
    return await toast.textContent();
  }

  async dismissToast() {
    const toast = this.page.locator(testData.selectors.toastNotification).first();
    if (await toast.count() > 0) {
      await toast.click();
    }
  }

  // Network helpers
  async interceptWebSocketMessages() {
    const messages = [];
    
    await this.page.route('**/socket.io/**', async (route) => {
      const response = await route.fetch();
      const body = await response.text();
      
      // Parse WebSocket messages if possible
      try {
        if (body.includes('threat-alert') || body.includes('connection-status')) {
          messages.push(body);
        }
      } catch (e) {
        // Ignore parsing errors
      }
      
      await route.fulfill({ response });
    });
    
    return messages;
  }

  // Validation helpers
  async validateThreatItemStructure(threatItem) {
    // Validate that threat item has all required elements
    await expect(threatItem.locator(testData.selectors.threatTitle)).toBeVisible();
    await expect(threatItem.locator(testData.selectors.threatDescription)).toBeVisible();
    await expect(threatItem.locator(testData.selectors.threatSeverityChip)).toBeVisible();
    await expect(threatItem.locator(testData.selectors.threatTimestamp)).toBeVisible();
  }

  async validateStatCountersAreNumbers() {
    const stats = await this.getAllStatCounters();
    
    expect(typeof stats.total).toBe('number');
    expect(typeof stats.critical).toBe('number');
    expect(typeof stats.high).toBe('number');
    expect(typeof stats.medium).toBe('number');
    expect(typeof stats.low).toBe('number');
    
    expect(stats.total).toBeGreaterThanOrEqual(0);
    expect(stats.critical).toBeGreaterThanOrEqual(0);
    expect(stats.high).toBeGreaterThanOrEqual(0);
    expect(stats.medium).toBeGreaterThanOrEqual(0);
    expect(stats.low).toBeGreaterThanOrEqual(0);
  }

  // Performance helpers
  async measurePageLoadTime() {
    const startTime = Date.now();
    await this.page.waitForLoadState('networkidle');
    return Date.now() - startTime;
  }

  async measureWebSocketConnectionTime() {
    const startTime = Date.now();
    await this.waitForWebSocketConnection();
    return Date.now() - startTime;
  }
}

module.exports = TestHelpers;