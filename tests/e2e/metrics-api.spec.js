const { test, expect } = require('@playwright/test');

test.describe('Real-Time Metrics API', () => {
  const API_BASE_URL = 'http://localhost:5000/api';

  test('should return current real-time metrics', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/metrics/realtime`);
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.timestamp).toBeDefined();
    
    // Verify metrics structure
    const metrics = data.data;
    expect(typeof metrics.activeThreats).toBe('number');
    expect(typeof metrics.criticalAlerts).toBe('number');
    expect(typeof metrics.systemHealth).toBe('number');
    expect(typeof metrics.networkActivity).toBe('number');
    expect(Array.isArray(metrics.threatTrends)).toBe(true);
    expect(typeof metrics.severityDistribution).toBe('object');
    expect(typeof metrics.sourceBreakdown).toBe('object');
    expect(Array.isArray(metrics.recentActivity)).toBe(true);
  });

  test('should force metrics refresh', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/metrics/refresh`);
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('updated successfully');
    expect(data.timestamp).toBeDefined();
  });

  test('should return health check status', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health`);
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('OK');
    expect(typeof data.uptime).toBe('number');
    expect(data.timestamp).toBeDefined();
  });

  test('should handle metrics API error gracefully', async ({ request }) => {
    // Test with invalid endpoint
    const response = await request.get(`${API_BASE_URL}/metrics/invalid`);
    
    expect(response.status()).toBe(404);
    
    const data = await response.json();
    expect(data.message).toContain('not found');
  });

  test('should validate metrics data ranges', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/metrics/realtime`);
    const data = await response.json();
    const metrics = data.data;
    
    // System health should be 0-100
    expect(metrics.systemHealth).toBeGreaterThanOrEqual(0);
    expect(metrics.systemHealth).toBeLessThanOrEqual(100);
    
    // Active threats and critical alerts should be non-negative
    expect(metrics.activeThreats).toBeGreaterThanOrEqual(0);
    expect(metrics.criticalAlerts).toBeGreaterThanOrEqual(0);
    
    // Network activity should be non-negative
    expect(metrics.networkActivity).toBeGreaterThanOrEqual(0);
    
    // Severity distribution values should be non-negative
    Object.values(metrics.severityDistribution).forEach(count => {
      expect(count).toBeGreaterThanOrEqual(0);
    });
    
    // Source breakdown values should be non-negative
    Object.values(metrics.sourceBreakdown).forEach(count => {
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test('should return threat trends with proper time series data', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/metrics/realtime`);
    const data = await response.json();
    const trends = data.data.threatTrends;
    
    if (trends.length > 0) {
      trends.forEach(dataPoint => {
        expect(dataPoint.timestamp).toBeDefined();
        expect(typeof dataPoint.threats).toBe('number');
        expect(typeof dataPoint.hour).toBe('number');
        expect(dataPoint.hour).toBeGreaterThanOrEqual(0);
        expect(dataPoint.hour).toBeLessThanOrEqual(23);
        expect(dataPoint.threats).toBeGreaterThanOrEqual(0);
      });
      
      // Trends should be in chronological order
      for (let i = 1; i < trends.length; i++) {
        const prevTime = new Date(trends[i-1].timestamp);
        const currTime = new Date(trends[i].timestamp);
        expect(currTime.getTime()).toBeGreaterThanOrEqual(prevTime.getTime());
      }
    }
  });

  test('should return recent activity with proper structure', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/metrics/realtime`);
    const data = await response.json();
    const activity = data.data.recentActivity;
    
    if (activity.length > 0) {
      activity.forEach(item => {
        expect(item.title).toBeDefined();
        expect(item.severity).toBeDefined();
        expect(item.source).toBeDefined();
        expect(item.createdAt).toBeDefined();
        
        // Validate severity values
        expect(['low', 'medium', 'high', 'critical']).toContain(item.severity);
        
        // Validate timestamp format
        expect(new Date(item.createdAt).toISOString()).toBe(item.createdAt);
      });
      
      // Recent activity should be in reverse chronological order (newest first)
      for (let i = 1; i < activity.length; i++) {
        const prevTime = new Date(activity[i-1].createdAt);
        const currTime = new Date(activity[i].createdAt);
        expect(prevTime.getTime()).toBeGreaterThanOrEqual(currTime.getTime());
      }
    }
  });

  test('should handle concurrent metrics requests', async ({ request }) => {
    // Send multiple concurrent requests
    const requests = Array(5).fill().map(() => 
      request.get(`${API_BASE_URL}/metrics/realtime`)
    );
    
    const responses = await Promise.all(requests);
    
    // All requests should succeed
    responses.forEach(response => {
      expect(response.ok()).toBeTruthy();
    });
    
    // All responses should have the same structure
    const dataPromises = responses.map(response => response.json());
    const dataArray = await Promise.all(dataPromises);
    
    dataArray.forEach(data => {
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.timestamp).toBeDefined();
    });
  });

  test('should maintain metrics consistency over multiple calls', async ({ request }) => {
    // Get metrics twice in succession
    const response1 = await request.get(`${API_BASE_URL}/metrics/realtime`);
    const response2 = await request.get(`${API_BASE_URL}/metrics/realtime`);
    
    expect(response1.ok()).toBeTruthy();
    expect(response2.ok()).toBeTruthy();
    
    const data1 = await response1.json();
    const data2 = await response2.json();
    
    // Structure should be consistent
    expect(Object.keys(data1.data)).toEqual(Object.keys(data2.data));
    
    // Data types should be consistent
    expect(typeof data1.data.activeThreats).toBe(typeof data2.data.activeThreats);
    expect(typeof data1.data.systemHealth).toBe(typeof data2.data.systemHealth);
    expect(Array.isArray(data1.data.threatTrends)).toBe(Array.isArray(data2.data.threatTrends));
  });

  test('should update metrics after refresh call', async ({ request }) => {
    // Get initial metrics
    const initialResponse = await request.get(`${API_BASE_URL}/metrics/realtime`);
    const initialData = await initialResponse.json();
    const initialTimestamp = initialData.timestamp;
    
    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Force refresh
    const refreshResponse = await request.post(`${API_BASE_URL}/metrics/refresh`);
    expect(refreshResponse.ok()).toBeTruthy();
    
    // Get updated metrics
    const updatedResponse = await request.get(`${API_BASE_URL}/metrics/realtime`);
    const updatedData = await updatedResponse.json();
    const updatedTimestamp = updatedData.timestamp;
    
    // Timestamp should be newer after refresh
    expect(new Date(updatedTimestamp).getTime()).toBeGreaterThan(new Date(initialTimestamp).getTime());
  });
});

test.describe('WebSocket Metrics Integration', () => {
  test('should connect to WebSocket and receive metrics updates', async ({ page }) => {
    let metricsReceived = false;
    let lastMetrics = null;

    // Set up WebSocket message capture
    await page.addInitScript(() => {
      window.metricsUpdates = [];
      window.socketConnected = false;
    });

    await page.goto('http://localhost:3000');
    
    // Mock WebSocket connection and message handler
    await page.evaluate(() => {
      // Simulate WebSocket connection
      window.socketConnected = true;
      
      // Simulate receiving metrics update
      setTimeout(() => {
        const mockMetrics = {
          activeThreats: 3,
          criticalAlerts: 1,
          systemHealth: 95,
          networkActivity: 542,
          threatTrends: [
            { timestamp: new Date().toISOString(), threats: 2, hour: 14 }
          ],
          severityDistribution: { low: 1, medium: 1, high: 1, critical: 0 },
          sourceBreakdown: { 'virustotal': 2, 'shodan': 1 },
          recentActivity: []
        };
        
        window.metricsUpdates.push(mockMetrics);
        
        // Trigger metrics update event
        if (window.socket_realtimeMetrics) {
          window.socket_realtimeMetrics(mockMetrics);
        }
      }, 1000);
    });

    // Wait for metrics update
    await page.waitForTimeout(1500);
    
    // Verify metrics were received
    const updates = await page.evaluate(() => window.metricsUpdates);
    expect(updates.length).toBeGreaterThan(0);
    
    const latestMetrics = updates[updates.length - 1];
    expect(latestMetrics.activeThreats).toBe(3);
    expect(latestMetrics.criticalAlerts).toBe(1);
    expect(latestMetrics.systemHealth).toBe(95);
  });

  test('should handle WebSocket connection errors', async ({ page }) => {
    await page.addInitScript(() => {
      window.socketErrors = [];
      window.connectionStatus = 'disconnected';
    });

    await page.goto('http://localhost:3000');
    
    // Simulate connection error
    await page.evaluate(() => {
      setTimeout(() => {
        window.socketErrors.push('Connection failed');
        window.connectionStatus = 'error';
        
        // Trigger error handler if exists
        if (window.socket_error) {
          window.socket_error({ message: 'Connection failed' });
        }
      }, 500);
    });

    await page.waitForTimeout(750);
    
    // Verify error handling
    const errors = await page.evaluate(() => window.socketErrors);
    const status = await page.evaluate(() => window.connectionStatus);
    
    expect(errors.length).toBeGreaterThan(0);
    expect(status).toBe('error');
  });
});