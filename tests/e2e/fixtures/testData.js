module.exports = {
  testUser: {
    email: 'test@cyberguard.com',
    password: 'TestPassword123!',
    fullName: 'Test User',
  },
  
  demoUser: {
    id: 'demo-user-id',
    email: 'demo@cyberguard.com',
    token: 'demo-token-for-testing',
  },

  threatExamples: [
    {
      type: 'malware',
      severity: 'high',
      title: 'Malware Detected in Network Traffic',
      description: 'Suspicious activity detected from IP 192.168.1.100',
    },
    {
      type: 'phishing',
      severity: 'medium',
      title: 'Phishing Attempt Blocked',
      description: 'Email with malicious links intercepted',
    },
    {
      type: 'intrusion',
      severity: 'critical',
      title: 'Unauthorized Access Attempt',
      description: 'Multiple failed login attempts detected',
    }
  ],

  webSocketEvents: {
    threatAlert: 'threat-alert',
    connectionStatus: 'connection-status',
    systemNotification: 'system-notification',
  },

  selectors: {
    // Authentication selectors
    loginForm: '[data-testid="login-form"]',
    emailInput: '[data-testid="email-input"]',
    passwordInput: '[data-testid="password-input"]',
    loginButton: '[data-testid="login-button"]',
    
    // Navigation selectors
    sidebar: '[data-testid="sidebar"]',
    threatMonitorLink: '[data-testid="nav-threat-monitor"]',
    
    // Threat Monitor selectors
    threatMonitorPage: '[data-testid="threat-monitor-page"]',
    connectionStatus: '[data-testid="connection-status"]',
    connectionStatusBadge: '[data-testid="connection-status-badge"]',
    threatStats: '[data-testid="threat-stats"]',
    totalThreatsCounter: '[data-testid="total-threats-counter"]',
    criticalThreatsCounter: '[data-testid="critical-threats-counter"]',
    highThreatsCounter: '[data-testid="high-threats-counter"]',
    mediumThreatsCounter: '[data-testid="medium-threats-counter"]',
    lowThreatsCounter: '[data-testid="low-threats-counter"]',
    
    // Threat Feed selectors
    threatFeed: '[data-testid="threat-feed"]',
    threatFeedList: '[data-testid="threat-feed-list"]',
    threatItem: '[data-testid="threat-item"]',
    threatTitle: '[data-testid="threat-title"]',
    threatDescription: '[data-testid="threat-description"]',
    threatSeverityChip: '[data-testid="threat-severity-chip"]',
    threatTimestamp: '[data-testid="threat-timestamp"]',
    
    // Toast notifications
    toastNotification: '.Toastify__toast',
    toastMessage: '.Toastify__toast-body',
  }
};