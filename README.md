# Cyber Guard Pro

A full-stack, industry-style cybersecurity platform built on the MERN stack. It provides real-time threat monitoring, vulnerability scanning, education/training modules, and rich reporting with export options.

## ✨ Highlights
- Realistic vulnerability scanning with plugin-based architecture (port, web, SSL, DNS, vulnerability) and verification metadata (verified, confidence, method, evidence level)
- Real-time threat monitoring via WebSockets with dynamic dashboard counters and alerts
- Security training modules (quizzes, phishing simulations, achievements, certificates)
- Report exports in JSON, CSV, and PDF
- URL-friendly scan input (accepts full URLs and normalizes to host)

## 🏗️ Architecture
- Client: React 18 + MUI v5, React Router 6, React Query, Socket.IO client
- Server: Node.js/Express, Mongoose (MongoDB), JWT auth, Socket.IO, Bull (optional), PDFKit
- Tests: Playwright E2E suite for app load, auth, scanning, threat monitoring, and integrations

Repo structure (abbreviated):
```
client/                  # React app (UI)
server/                  # Express API and services
  routes/                # REST endpoints (auth, scans, threats, reports, education, users)
  services/              # business logic (scanner, threat monitor, mailer, websockets)
  models/                # Mongoose models (User, ThreatAlert, VulnerabilityReport, etc.)
  middleware/            # auth, security
  config/                # bull/redis (optional)
  server.js              # app bootstrap

tests/e2e/               # Playwright tests, fixtures, helpers
playwright.config.js     # Playwright configuration
```

## 🚀 Getting started (local)
Prereqs:
- Node.js 18+
- MongoDB running at mongodb://localhost:27017

1) Install dependencies
- From repo root:
  - `npm run install-all`

2) Configure environment variables
- Server: copy `server/.env.example` to `server/.env` and set values
  - Minimum required: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`
  - Mailer: `MAIL_PROVIDER=gmail`, `EMAIL_USER`, `EMAIL_PASS` (or SMTP variants)

3) Start dev servers
- From repo root:
  - `npm run dev`
  - This runs server (port 5000) and client (port 3000) concurrently

4) Open the app
- http://localhost:3000

## 🔐 Environment variables
Server `.env` keys (see `server/.env.example` for more):
- CORE
  - `NODE_ENV`, `PORT`
  - `CLIENT_URL`
  - `MONGODB_URI`
  - `JWT_SECRET`, `JWT_EXPIRE`
- Redis/Bull (optional)
  - `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`
- Third-party (optional)
  - `VIRUSTOTAL_API_KEY`, `SHODAN_API_KEY`, `HIBP_API_KEY`
- Mailer
  - `MAIL_PROVIDER=gmail|smtp`
  - Gmail: `EMAIL_USER`, `EMAIL_PASS` (app password)
  - SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `EMAIL_USER`, `EMAIL_PASS`

## 📬 Email setup
We use Nodemailer with pluggable transport.
- Gmail (recommended for quick start)
  - Enable 2FA on your Google account
  - Create an "App Password" and set `EMAIL_PASS`
  - Set `MAIL_PROVIDER=gmail`, `EMAIL_USER=<your gmail>`
- SMTP
  - Set `MAIL_PROVIDER=smtp` and provide `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `EMAIL_USER`, `EMAIL_PASS`

Test the mailer:
- From `server/`: `node scripts/test-mailer.js your@email`
- You should see a `✅ Email sent ...` line in the console

## 🧪 Testing
Playwright tests:
- Run from repo root:
  - Headless: `npm run test:e2e`
  - Headed: `npm run test:e2e:headed`
  - UI: `npm run test:e2e:ui`
  - Debug: `npm run test:e2e:debug`

Reports:
- After a run, open `playwright-report/index.html` for timelines, screenshots, videos, and traces

## 🔍 Key endpoints (server)
- Auth: `POST /api/auth/register`, `POST /api/auth/login`
- Scans: `POST /api/scans` (start), `GET /api/scans/:scanId` (status)
- Export: `GET /api/scans/:scanId/export?format=json|csv|pdf`
- Threats: `GET /api/threats` (list active), WebSocket updates
- Education: `GET /api/education/modules`, `POST /api/education/progress`

## 🧠 Features in detail
- Vulnerability scanning
  - Plugin pipeline with dynamic heuristics
  - Passive web checks (HTTP redirect/HSTS/jQuery) and verification metadata (verified, confidence, method, evidence)
  - Accepts hostnames and full URLs
- Reporting
  - CSV, PDF, and JSON exports with proper content-disposition headers
- Real-time dashboard
  - Live threat feed, counters, toast notifications
- Security training
  - Modules, quizzes, phishing simulation, achievements, certificates

## 🛠️ Troubleshooting
- MongoDB not connected: ensure it’s running at `MONGODB_URI`
- CORS: set `CLIENT_URL` to your frontend origin
- Email didn’t send:
  - Check server logs for `❌ Error sending email`
  - Verify `MAIL_PROVIDER`, `EMAIL_USER`, `EMAIL_PASS` (Gmail requires App Password)
  - For SMTP, confirm `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` and credentials
- E2E tests fail:
  - Ensure both client (3000) and server (5000) are running
  - Increase timeouts if running on slow hardware

## 📦 Build & deploy
- Build client: `npm run build` (from repo root invokes client build)
- Heroku/Render/Other: Ensure `server/.env` is configured and `heroku-postbuild` script installs client and builds

## 📄 License
MIT