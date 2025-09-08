# E2E Tests for CyberGuard Pro Real-time Threat Monitoring

This directory contains comprehensive End-to-End (E2E) tests for the real-time threat monitoring system using Playwright.

## Overview

The E2E tests verify the complete real-time threat monitoring workflow:

- **WebSocket connection establishment and reconnection**
- **Real-time threat alerts reception and display**
- **Dynamic statistics counter updates**
- **Toast notifications for critical threats**
- **UI responsiveness during rapid updates**
- **Data integrity and consistency**
- **Error handling and recovery**

## Test Structure

```
tests/e2e/
├── fixtures/          # Test data and configuration
│   └── testData.js     # Test selectors, data, and constants
├── utils/             # Helper functions and utilities
│   └── testHelpers.js  # Reusable test helper methods
├── threatMonitor.spec.js  # Main threat monitoring E2E tests
├── setup.js           # Test environment setup
└── README.md          # This file
```

## Key Features Tested

### 1. WebSocket Connection
- ✅ Connection establishment on page load
- ✅ Connection status indicator accuracy
- ✅ Graceful reconnection handling
- ✅ Performance measurement (< 5 seconds)

### 2. Real-time Threat Alerts
- ✅ New threat reception and display
- ✅ Threat structure validation (title, description, severity, timestamp)
- ✅ Multiple concurrent threat handling
- ✅ Proper threat ordering (newest first)
- ✅ Severity categorization accuracy

### 3. Statistics and Counters
- ✅ Dynamic counter updates
- ✅ Statistics consistency (total = sum of severities)
- ✅ Monotonic increase validation
- ✅ Real-time synchronization with threat feed

### 4. User Interface
- ✅ UI responsiveness during rapid updates
- ✅ Performance optimization (max 50 threats displayed)
- ✅ Data persistence during interactions
- ✅ Scroll behavior and state management

### 5. Data Integrity
- ✅ Accurate timestamp display
- ✅ Consistent threat data across page interactions
- ✅ Real-time data synchronization

### 6. Error Handling
- ✅ WebSocket disconnection gracefully handled
- ✅ Appropriate empty state messages
- ✅ Connection recovery procedures

## Test Data

The tests use **real, dynamic data** from the actual threat monitoring system:

- Real WebSocket connections to `localhost:5000`
- Actual threat generation from `threatMonitor.js` service
- Live database operations with MongoDB
- Genuine real-time event processing

**No synthetic or hardcoded threat data is used** - all tests interact with the actual system generating real threats.

## Running the Tests

### Prerequisites
1. MongoDB running on localhost:27017
2. Server running on port 5000
3. Client running on port 3000
4. Playwright installed

### Commands

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run tests with browser UI visible
npm run test:e2e:headed

# Run tests with Playwright Test UI
npm run test:e2e:ui

# Debug tests with step-by-step execution
npm run test:e2e:debug
```

### Test Environment

The tests automatically start the required services:
- Backend server on port 5000
- Frontend client on port 3000
- MongoDB connection for data persistence
- WebSocket server for real-time communication

## Test Selectors

All test selectors use `data-testid` attributes for reliable element identification:

```javascript
// Connection status
'[data-testid="connection-status"]'
'[data-testid="connection-status-badge"]'

// Statistics counters
'[data-testid="total-threats-counter"]'
'[data-testid="critical-threats-counter"]'
// ... etc

// Threat feed
'[data-testid="threat-feed"]'
'[data-testid="threat-item"]'
'[data-testid="threat-title"]'
// ... etc
```

## Test Helper Functions

The `TestHelpers` class provides reusable methods:

- `waitForWebSocketConnection()` - Waits for WebSocket to connect
- `waitForNewThreatAlert()` - Waits for new threats to appear
- `getAllStatCounters()` - Retrieves all statistics counters
- `getLatestThreatDetails()` - Gets details of most recent threat
- `validateThreatItemStructure()` - Validates threat display structure

## Expected Behavior

### Threat Generation
The system generates demo threats every 30 seconds to 2 minutes with realistic data:
- Various severity levels (critical, high, medium, low)
- Different threat types (malware, phishing, intrusion, etc.)
- Real timestamps and risk scores
- Proper categorization and display

### Real-time Updates
- New threats appear at the top of the feed
- Statistics counters increment appropriately
- Connection status reflects actual WebSocket state
- Toast notifications for certain threat types
- UI remains responsive throughout

### Performance Requirements
- WebSocket connection < 5 seconds
- UI updates within 1 second of threat generation
- Maximum 50 threats displayed (performance optimization)
- No UI freezing during rapid threat generation

## Debugging Tips

1. **Connection Issues**: Check if services are running on correct ports
2. **Timing Issues**: Threats generate every 30s-2min, adjust timeouts accordingly
3. **Selector Issues**: Use browser devtools to verify `data-testid` attributes
4. **WebSocket Issues**: Check browser console for WebSocket connection errors

## Continuous Integration

The tests are designed to run in CI environments:
- Automatic service startup/shutdown
- Configurable timeouts for different environments
- Parallel execution support
- Comprehensive error reporting

## Test Reports

Playwright generates detailed HTML reports with:
- Test execution timeline
- Screenshots on failures
- Video recordings of test runs
- Network activity logs
- WebSocket message traces

Access reports at: `playwright-report/index.html`