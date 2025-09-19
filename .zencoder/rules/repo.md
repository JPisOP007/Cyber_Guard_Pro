---
description: Repository Information Overview
alwaysApply: true
---

# Cyber Guard Pro Information

## Summary
Cyber Guard Pro is a comprehensive cybersecurity platform built with the MERN stack (MongoDB, Express, React, Node.js). It provides real-time threat monitoring, vulnerability scanning, security training, and reporting features.

## Structure
- **client/**: React frontend application with Material UI
- **server/**: Express.js backend API with MongoDB integration
- **tests/**: End-to-end and integration tests using Playwright

## Language & Runtime
**Language**: JavaScript (Node.js, React)
**Version**: Node.js (backend), React 18.2.0 (frontend)
**Build System**: npm scripts
**Package Manager**: npm

## Dependencies

### Backend Dependencies
**Main Dependencies**:
- express: ^4.18.2 (Web server framework)
- mongoose: ^7.5.0 (MongoDB ODM)
- socket.io: ^4.7.2 (WebSocket server)
- jsonwebtoken: ^9.0.2 (Authentication)
- bull: ^4.11.3 (Job queue)
- bcryptjs: ^2.4.3 (Password hashing)

**Development Dependencies**:
- jest: ^29.6.4 (Testing)
- nodemon: ^3.0.1 (Development server)
- supertest: ^6.3.3 (API testing)

### Frontend Dependencies
**Main Dependencies**:
- react: ^18.2.0 (UI library)
- react-router-dom: ^6.15.0 (Routing)
- @mui/material: ^5.14.8 (UI components)
- axios: ^1.5.0 (HTTP client)
- socket.io-client: ^4.8.1 (WebSocket client)
- chart.js: ^4.4.0 (Data visualization)
- react-query: ^3.39.3 (Data fetching)

## Build & Installation
```bash
# Install all dependencies
npm run install-all

# Development mode (runs both client and server)
npm run dev

# Build client for production
npm run build

# Start server only
npm run server

# Start client only
npm run client
```

## Testing
**Framework**: Playwright for E2E tests, Jest for unit tests
**Test Location**: 
- E2E tests: tests/e2e/
- Unit tests: server/ and client/ test directories

**Run Commands**:
```bash
# Run all tests (unit and integration)
npm test

# Run E2E tests
npm run test:e2e

# Run E2E tests with browser UI visible
npm run test:e2e:headed

# Run E2E tests with Playwright Test UI
npm run test:e2e:ui

# Debug E2E tests with step-by-step execution
npm run test:e2e:debug
```

## Main Components

### Backend Services
- **threatMonitor.js**: Real-time threat detection and alerting
- **vulnerabilityScanner.js**: System vulnerability scanning
- **websocketHandler.js**: WebSocket communication management
- **realTimeMetrics.js**: System metrics collection and reporting

### Frontend Features
- **Dashboard**: Overview of security status and metrics
- **VulnerabilityScanner**: Interface for scanning and remediation
- **ThreatMonitor**: Real-time threat visualization and alerts
- **SecurityTraining**: Educational content for security awareness
- **Reports**: Detailed security reports and analytics