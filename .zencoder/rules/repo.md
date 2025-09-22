---
description: Repository Information Overview
alwaysApply: true
---

# CyberGuard Pro Information

## Summary
CyberGuard Pro is a comprehensive cybersecurity platform built using the MERN stack (MongoDB, Express, React, Node.js). It provides vulnerability scanning, threat monitoring, security training, and reporting features to help users protect their systems.

## Structure
- **client/**: React frontend application
- **server/**: Express.js backend API
- **tests/**: End-to-end tests using Playwright
- **playwright-report/**: Test reports and artifacts
- **test-results/**: Test execution results

## Projects

### Backend (Express.js)
**Configuration File**: server/package.json

#### Language & Runtime
**Language**: JavaScript (Node.js)
**Version**: Node.js (not specified, using modern features)
**Package Manager**: npm
**Database**: MongoDB

#### Dependencies
**Main Dependencies**:
- express: ^4.18.2 (Web framework)
- mongoose: ^7.5.0 (MongoDB ODM)
- socket.io: ^4.7.2 (WebSockets)
- jsonwebtoken: ^9.0.2 (Authentication)
- bcryptjs: ^2.4.3 (Password hashing)
- bull: ^4.11.3 (Job queue)
- redis: ^4.6.8 (Caching)
- helmet: ^7.0.0 (Security headers)
- cors: ^2.8.5 (CORS support)

**Development Dependencies**:
- jest: ^29.6.4 (Testing)
- nodemon: ^3.0.1 (Development server)
- supertest: ^6.3.3 (API testing)

#### Build & Installation
```bash
cd server
npm install
npm run dev  # Development mode
npm start    # Production mode
```

#### Testing
**Framework**: Jest
**Run Command**:
```bash
cd server
npm test
```

### Frontend (React)
**Configuration File**: client/package.json

#### Language & Runtime
**Language**: JavaScript (React)
**Version**: React 18.2.0
**Package Manager**: npm
**Build Tool**: react-scripts (Create React App)

#### Dependencies
**Main Dependencies**:
- react: ^18.2.0
- react-dom: ^18.2.0
- react-router-dom: ^6.15.0
- @mui/material: ^5.14.8
- @mui/icons-material: ^5.14.8
- axios: ^1.5.0
- chart.js: ^4.4.0
- react-chartjs-2: ^5.2.0
- socket.io-client: ^4.8.1
- react-query: ^3.39.3
- framer-motion: ^10.16.4

#### Build & Installation
```bash
cd client
npm install
npm start    # Development mode
npm run build  # Production build
```

#### Testing
**Framework**: Jest with React Testing Library
**Run Command**:
```bash
cd client
npm test
```

### End-to-End Testing
**Configuration File**: playwright.config.js

#### Language & Runtime
**Language**: JavaScript
**Framework**: Playwright
**Version**: ^1.55.0

#### Testing
**Test Location**: tests/e2e/
**Naming Convention**: *.spec.js
**Run Command**:
```bash
npm run test:e2e
npm run test:e2e:headed  # With browser UI
npm run test:e2e:ui      # With Playwright UI
```

## Main Features
- **Vulnerability Scanning**: Scans systems for security vulnerabilities
- **Threat Monitoring**: Real-time monitoring of security threats
- **Security Training**: Educational resources for security awareness
- **Reporting**: Comprehensive security reports and analytics
- **Real-time Updates**: WebSocket integration for live notifications