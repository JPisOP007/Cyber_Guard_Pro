const { test, expect } = require('@playwright/test');

test.describe('Real-Time Threat Monitoring', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Mock WebSocket connection for testing
    await page.addInitScript(() => {
      window.mockThreats = [];
      window.mockMetrics = {
        activeThreats: 0,
        criticalAlerts: 0,
        systemHealth: 100,
        networkActivity: 0,
        threatTrends: [],
        severityDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
        sourceBreakdown: {},
        recentActivity: []
      };

      // Mock Socket.io for testing
      window.io = () => ({
        emit: (event, data) => {
          console.log(`Socket emit: ${event}`, data);
        },
        on: (event, callback) => {
          window[`socket_${event}`] = callback;
        },
        connect: () => {},
        disconnect: () => {}
      });
    });

    await page.goto('http://localhost:3000');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should display real-time threat dashboard', async () => {
    // Wait for dashboard to load
    await expect(page.locator('[data-testid="threat-dashboard"]')).toBeVisible();
    
    // Check key metrics are displayed
    await expect(page.locator('[data-testid="active-threats-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="critical-alerts-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="system-health-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="network-activity"]')).toBeVisible();
  });

  test('should receive real-time threat alerts via WebSocket', async () => {
    // Navigate to monitoring page
    await page.click('[data-testid="monitoring-tab"]');
    
    // Subscribe to threat alerts
    await page.click('[data-testid="start-monitoring"]');
    
    // Simulate incoming threat alert
    const mockThreat = {
      type: 'new-threat',
      data: {
        _id: 'test-threat-001',
        title: 'Test Malware Detection',
        description: 'Test threat for E2E verification',
        severity: 'high',
        source: 'virustotal',
        detectedAt: new Date().toISOString(),
        riskScore: 85
      }
    };

    // Inject threat alert via WebSocket simulation
    await page.evaluate((threat) => {
      if (window.socket_threatAlert) {
        window.socket_threatAlert(threat);
      }
    }, mockThreat);

    // Verify threat appears in UI
    await expect(page.locator('[data-testid="threat-alert"]').first()).toContainText('Test Malware Detection');
    await expect(page.locator('[data-testid="threat-severity"]').first()).toContainText('high');
  });

  test('should update metrics in real-time', async () => {
    // Navigate to dashboard
    await page.click('[data-testid="dashboard-tab"]');
    
    // Get initial metrics
    const initialThreats = await page.locator('[data-testid="active-threats-count"]').textContent();
    
    // Simulate metrics update
    const updatedMetrics = {
      activeThreats: 5,
      criticalAlerts: 2,
      systemHealth: 92,
      networkActivity: 750,
      threatTrends: [
        { timestamp: new Date().toISOString(), threats: 3, hour: 14 }
      ],
      severityDistribution: { low: 1, medium: 2, high: 1, critical: 1 },
      sourceBreakdown: { 'virustotal': 3, 'shodan': 2 },
      recentActivity: [
        {
          title: 'Malware Detected',
          severity: 'high',
          source: 'virustotal',
          createdAt: new Date().toISOString()
        }
      ]
    };

    // Inject metrics update
    await page.evaluate((metrics) => {
      if (window.socket_realtimeMetrics) {
        window.socket_realtimeMetrics(metrics);
      }
    }, updatedMetrics);

    // Verify metrics are updated
    await expect(page.locator('[data-testid="active-threats-count"]')).toContainText('5');
    await expect(page.locator('[data-testid="critical-alerts-count"]')).toContainText('2');
    await expect(page.locator('[data-testid="system-health-score"]')).toContainText('92');
  });

  test('should display threat severity distribution', async () => {
    // Navigate to analytics page
    await page.click('[data-testid="analytics-tab"]');
    
    // Mock severity distribution data
    const mockDistribution = {
      severityDistribution: { low: 10, medium: 5, high: 3, critical: 1 }
    };

    await page.evaluate((data) => {
      if (window.socket_realtimeMetrics) {
        window.socket_realtimeMetrics(data);
      }
    }, mockDistribution);

    // Verify severity chart is displayed
    await expect(page.locator('[data-testid="severity-chart"]')).toBeVisible();
    
    // Check severity counts
    await expect(page.locator('[data-testid="low-severity-count"]')).toContainText('10');
    await expect(page.locator('[data-testid="medium-severity-count"]')).toContainText('5');
    await expect(page.locator('[data-testid="high-severity-count"]')).toContainText('3');
    await expect(page.locator('[data-testid="critical-severity-count"]')).toContainText('1');
  });

  test('should handle threat alert acknowledgment', async () => {
    // Navigate to alerts page
    await page.click('[data-testid="alerts-tab"]');
    
    // Wait for alerts to load
    await expect(page.locator('[data-testid="alerts-list"]')).toBeVisible();
    
    // Click acknowledge button on first alert
    await page.click('[data-testid="acknowledge-threat"]:first-child');
    
    // Verify acknowledgment modal appears
    await expect(page.locator('[data-testid="acknowledge-modal"]')).toBeVisible();
    
    // Confirm acknowledgment
    await page.click('[data-testid="confirm-acknowledge"]');
    
    // Verify alert status changes
    await expect(page.locator('[data-testid="alert-status"]').first()).toContainText('investigating');
  });

  test('should display threat source breakdown', async () => {
    // Navigate to sources page
    await page.click('[data-testid="sources-tab"]');
    
    // Mock source breakdown data
    const mockSources = {
      sourceBreakdown: {
        'virustotal': 15,
        'shodan': 8,
        'hibp': 3,
        'network-monitor': 12,
        'internal-scan': 7
      }
    };

    await page.evaluate((data) => {
      if (window.socket_realtimeMetrics) {
        window.socket_realtimeMetrics(data);
      }
    }, mockSources);

    // Verify source breakdown chart
    await expect(page.locator('[data-testid="sources-chart"]')).toBeVisible();
    
    // Check specific source counts
    await expect(page.locator('[data-testid="virustotal-count"]')).toContainText('15');
    await expect(page.locator('[data-testid="shodan-count"]')).toContainText('8');
    await expect(page.locator('[data-testid="hibp-count"]')).toContainText('3');
  });

  test('should show network monitoring status', async () => {
    // Navigate to network monitoring
    await page.click('[data-testid="network-tab"]');
    
    // Verify network monitoring is active
    await expect(page.locator('[data-testid="network-status"]')).toContainText('Active');
    
    // Check network activity metrics
    await expect(page.locator('[data-testid="network-activity-gauge"]')).toBeVisible();
    
    // Simulate network anomaly
    const networkAnomaly = {
      type: 'new-threat',
      data: {
        _id: 'network-anomaly-001',
        title: 'Suspicious Network Traffic',
        description: 'Unusual data patterns detected on internal network',
        severity: 'medium',
        source: 'network-monitor',
        type: 'suspicious-traffic',
        detectedAt: new Date().toISOString(),
        indicators: {
          sourceIp: '10.0.0.45',
          protocol: 'TCP'
        }
      }
    };

    await page.evaluate((anomaly) => {
      if (window.socket_threatAlert) {
        window.socket_threatAlert(anomaly);
      }
    }, networkAnomaly);

    // Verify network anomaly appears
    await expect(page.locator('[data-testid="network-anomaly"]').first()).toContainText('Suspicious Network Traffic');
  });

  test('should handle API key configuration status', async () => {
    // Navigate to settings
    await page.click('[data-testid="settings-tab"]');
    
    // Check API integration status
    await expect(page.locator('[data-testid="api-status"]')).toBeVisible();
    
    // Should show configured APIs
    await expect(page.locator('[data-testid="virustotal-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="shodan-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="hibp-status"]')).toBeVisible();
  });

  test('should display threat trends over time', async () => {
    // Navigate to trends page
    await page.click('[data-testid="trends-tab"]');
    
    // Mock trend data for last 24 hours
    const mockTrends = {
      threatTrends: [
        { timestamp: '2024-01-01T10:00:00Z', threats: 2, hour: 10 },
        { timestamp: '2024-01-01T11:00:00Z', threats: 5, hour: 11 },
        { timestamp: '2024-01-01T12:00:00Z', threats: 3, hour: 12 },
        { timestamp: '2024-01-01T13:00:00Z', threats: 8, hour: 13 },
        { timestamp: '2024-01-01T14:00:00Z', threats: 4, hour: 14 }
      ]
    };

    await page.evaluate((data) => {
      if (window.socket_realtimeMetrics) {
        window.socket_realtimeMetrics(data);
      }
    }, mockTrends);

    // Verify trends chart is displayed
    await expect(page.locator('[data-testid="trends-chart"]')).toBeVisible();
    
    // Check trend data points
    await expect(page.locator('[data-testid="trend-data-point"]')).toHaveCount(5);
  });

  test('should handle system health scoring', async () => {
    // Navigate to health dashboard
    await page.click('[data-testid="health-tab"]');
    
    // Mock various health scenarios
    const healthScenarios = [
      { systemHealth: 100, expectedStatus: 'Excellent' },
      { systemHealth: 85, expectedStatus: 'Good' },
      { systemHealth: 65, expectedStatus: 'Warning' },
      { systemHealth: 40, expectedStatus: 'Critical' }
    ];

    for (const scenario of healthScenarios) {
      await page.evaluate((data) => {
        if (window.socket_realtimeMetrics) {
          window.socket_realtimeMetrics(data);
        }
      }, scenario);

      // Verify health status updates
      await expect(page.locator('[data-testid="health-score"]')).toContainText(scenario.systemHealth.toString());
    }
  });

  test('should show recent activity feed', async () => {
    // Navigate to activity feed
    await page.click('[data-testid="activity-tab"]');
    
    // Mock recent activity data
    const mockActivity = {
      recentActivity: [
        {
          title: 'Malware Sample Detected',
          severity: 'critical',
          source: 'virustotal',
          createdAt: new Date().toISOString()
        },
        {
          title: 'Vulnerable Service Found',
          severity: 'high',
          source: 'shodan',
          createdAt: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
        },
        {
          title: 'Data Breach Alert',
          severity: 'medium',
          source: 'hibp',
          createdAt: new Date(Date.now() - 600000).toISOString() // 10 minutes ago
        }
      ]
    };

    await page.evaluate((data) => {
      if (window.socket_realtimeMetrics) {
        window.socket_realtimeMetrics(data);
      }
    }, mockActivity);

    // Verify activity feed displays items
    await expect(page.locator('[data-testid="activity-item"]')).toHaveCount(3);
    
    // Check specific activity items
    await expect(page.locator('[data-testid="activity-item"]').first()).toContainText('Malware Sample Detected');
    await expect(page.locator('[data-testid="activity-severity"]').first()).toContainText('critical');
  });
});

test.describe('Threat Intelligence API Integration', () => {
  test('should handle API authentication failures gracefully', async ({ page }) => {
    // Navigate to monitoring page
    await page.goto('http://localhost:3000');
    await page.click('[data-testid="monitoring-tab"]');
    
    // Mock API authentication failure
    await page.route('/api/threats/**', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Authentication failed' })
      });
    });
    
    // Start monitoring
    await page.click('[data-testid="start-monitoring"]');
    
    // Verify error handling
    await expect(page.locator('[data-testid="api-error-message"]')).toContainText('Authentication failed');
    await expect(page.locator('[data-testid="fallback-mode"]')).toContainText('Demo mode active');
  });

  test('should handle API rate limiting', async ({ page }) => {
    // Navigate to monitoring page
    await page.goto('http://localhost:3000');
    await page.click('[data-testid="monitoring-tab"]');
    
    // Mock API rate limiting
    await page.route('/api/threats/**', route => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Rate limit exceeded' })
      });
    });
    
    // Start monitoring
    await page.click('[data-testid="start-monitoring"]');
    
    // Verify rate limiting is handled
    await expect(page.locator('[data-testid="rate-limit-warning"]')).toContainText('Rate limit exceeded');
  });

  test('should display API configuration status', async ({ page }) => {
    await page.goto('http://localhost:3000/settings');
    
    // Check API key status indicators
    await expect(page.locator('[data-testid="virustotal-key-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="shodan-key-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="hibp-key-status"]')).toBeVisible();
    
    // Should show either configured or missing status
    const vtStatus = await page.locator('[data-testid="virustotal-key-status"]').textContent();
    expect(['Configured', 'Missing', 'Invalid']).toContain(vtStatus);
  });
});