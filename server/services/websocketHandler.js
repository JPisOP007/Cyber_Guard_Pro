const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ThreatAlert = require('../models/ThreatAlert');
const VulnerabilityReport = require('../models/VulnerabilityReport');

class WebSocketHandler {
  constructor() {
    this.connectedUsers = new Map();
    this.userRooms = new Map();
    this.activeConnections = 0;
  }

  initialize(io) {
    this.io = io;

    // Authentication middleware for socket connections
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Handle demo user
        if (decoded.id === 'demo-user-id') {
          socket.userId = 'demo-user-id';
          socket.userEmail = 'demo@cyberguard.com';
          socket.userRole = 'user';
          return next();
        }

        const user = await User.findById(decoded.id);
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.userEmail = user.email;
        socket.userRole = user.role;
        
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    console.log('WebSocket handler initialized');
  }

  handleConnection(socket) {
    const userId = socket.userId;
    
    console.log(`User ${socket.userEmail} connected - Socket ID: ${socket.id}`);
    
    // Track user connection
    this.connectedUsers.set(userId, {
      socketId: socket.id,
      email: socket.userEmail,
      role: socket.userRole,
      connectedAt: new Date(),
      lastActivity: new Date()
    });
    
    this.activeConnections++;

    // Join user-specific room
    socket.join(`user:${userId}`);
    
    // Join role-based rooms
    socket.join(`role:${socket.userRole}`);
    
    // Handle different event types
    this.setupEventHandlers(socket);
    
    // Send initial data
    this.sendInitialData(socket, userId);
    
    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }

  setupEventHandlers(socket) {
    const userId = socket.userId;

    // Scan-related events
    socket.on('scan:start', async (data) => {
      try {
        await this.handleScanStart(socket, userId, data);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('scan:status', async (scanId) => {
      try {
        await this.handleScanStatus(socket, userId, scanId);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('scan:cancel', async (scanId) => {
      try {
        await this.handleScanCancel(socket, userId, scanId);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Threat-related events
    socket.on('threat:acknowledge', async (alertId) => {
      try {
        await this.handleThreatAcknowledge(socket, userId, alertId);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('threat:resolve', async (data) => {
      try {
        await this.handleThreatResolve(socket, userId, data);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('threat:escalate', async (data) => {
      try {
        await this.handleThreatEscalate(socket, userId, data);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Real-time monitoring events
    socket.on('monitor:subscribe', (targets) => {
      this.handleMonitorSubscribe(socket, userId, targets);
    });

    socket.on('monitor:unsubscribe', (targets) => {
      this.handleMonitorUnsubscribe(socket, userId, targets);
    });

    // User activity tracking
    socket.on('activity:heartbeat', () => {
      this.updateUserActivity(userId);
    });

    // Dashboard events
    socket.on('dashboard:subscribe', () => {
      socket.join(`dashboard:${userId}`);
      this.sendDashboardUpdate(socket, userId);
    });

    socket.on('dashboard:unsubscribe', () => {
      socket.leave(`dashboard:${userId}`);
    });

    // Real-time metrics events
    socket.on('metrics:subscribe', () => {
      socket.join('metrics-subscribers');
      // Send current metrics immediately
      const realTimeMetrics = require('./realTimeMetrics');
      socket.emit('realtime-metrics', realTimeMetrics.getCurrentMetrics());
    });

    socket.on('metrics:unsubscribe', () => {
      socket.leave('metrics-subscribers');
    });

    // Chat/collaboration events (for team features)
    socket.on('team:join', (teamId) => {
      if (this.canJoinTeam(socket.userRole, teamId)) {
        socket.join(`team:${teamId}`);
      }
    });

    socket.on('team:message', (data) => {
      if (data.teamId) {
        socket.to(`team:${data.teamId}`).emit('team:message', {
          from: socket.userEmail,
          message: data.message,
          timestamp: new Date()
        });
      }
    });
  }

  async sendInitialData(socket, userId) {
    try {
      // Send recent alerts
      const recentAlerts = await ThreatAlert.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      socket.emit('initial:alerts', recentAlerts);

      // Send active scans
      const activeScans = await VulnerabilityReport.find({ 
        userId, 
        status: { $in: ['pending', 'running'] }
      }).lean();

      socket.emit('initial:scans', activeScans);

      // Send system status
      socket.emit('initial:status', {
        connected: true,
        timestamp: new Date(),
        activeConnections: this.activeConnections
      });

    } catch (error) {
      console.error('Error sending initial data:', error);
      socket.emit('error', { message: 'Failed to load initial data' });
    }
  }

  async handleScanStart(socket, userId, data) {
    // This would integrate with the vulnerability scanner
    const vulnerabilityScanner = require('./vulnerabilityScanner');
    
    const result = await vulnerabilityScanner.startScan(userId, data.targets, data.config);
    socket.emit('scan:started', result);

    // Notify all user sessions
    this.io.to(`user:${userId}`).emit('scan:notification', {
      type: 'scan_started',
      scanId: result.scanId,
      message: 'Vulnerability scan started'
    });
  }

  async handleScanStatus(socket, userId, scanId) {
    const vulnerabilityScanner = require('./vulnerabilityScanner');
    
    const status = await vulnerabilityScanner.getScanStatus(scanId);
    socket.emit('scan:status-update', status);
  }

  async handleScanCancel(socket, userId, scanId) {
    const vulnerabilityScanner = require('./vulnerabilityScanner');
    
    const result = await vulnerabilityScanner.cancelScan(scanId);
    socket.emit('scan:cancelled', result);

    // Notify all user sessions
    this.io.to(`user:${userId}`).emit('scan:notification', {
      type: 'scan_cancelled',
      scanId,
      message: 'Vulnerability scan cancelled'
    });
  }

  async handleThreatAcknowledge(socket, userId, alertId) {
    const alert = await ThreatAlert.findOne({ _id: alertId, userId });
    if (!alert) {
      throw new Error('Threat alert not found');
    }

    alert.status = 'investigating';
    alert.investigation.assigned = userId;
    alert.investigation.assignedAt = new Date();
    await alert.save();

    socket.emit('threat:acknowledged', { alertId, status: 'investigating' });
    
    // Notify other user sessions
    this.io.to(`user:${userId}`).emit('threat:updated', alert);
  }

  async handleThreatResolve(socket, userId, data) {
    const alert = await ThreatAlert.findOne({ _id: data.alertId, userId });
    if (!alert) {
      throw new Error('Threat alert not found');
    }

    await alert.resolve(data.resolution, userId);
    
    socket.emit('threat:resolved', { alertId: data.alertId });
    
    // Notify other user sessions
    this.io.to(`user:${userId}`).emit('threat:updated', alert);
  }

  async handleThreatEscalate(socket, userId, data) {
    const alert = await ThreatAlert.findOne({ _id: data.alertId, userId });
    if (!alert) {
      throw new Error('Threat alert not found');
    }

    await alert.escalate(data.reason, userId);
    
    socket.emit('threat:escalated', { alertId: data.alertId, priority: alert.priority });
    
    // Notify admins if escalated to high priority
    if (alert.priority >= 4) {
      this.io.to('role:admin').emit('threat:high-priority', alert);
    }
    
    // Notify other user sessions
    this.io.to(`user:${userId}`).emit('threat:updated', alert);
  }

  handleMonitorSubscribe(socket, userId, targets) {
    if (Array.isArray(targets)) {
      targets.forEach(target => {
        socket.join(`monitor:${target}`);
      });
      
      socket.emit('monitor:subscribed', { targets, status: 'success' });
    }
  }

  handleMonitorUnsubscribe(socket, userId, targets) {
    if (Array.isArray(targets)) {
      targets.forEach(target => {
        socket.leave(`monitor:${target}`);
      });
      
      socket.emit('monitor:unsubscribed', { targets, status: 'success' });
    }
  }

  async sendDashboardUpdate(socket, userId) {
    try {
      // Get latest security metrics
      const SecurityProfile = require('../models/SecurityProfile');
      const profile = await SecurityProfile.findOne({ userId });
      
      if (profile) {
        socket.emit('dashboard:security-score', {
          overall: profile.securityScore.overall,
          components: profile.securityScore.components,
          riskLevel: profile.riskLevel,
          lastUpdated: profile.updatedAt
        });
      }

      // Get recent threat count
      const threatCount = await ThreatAlert.countDocuments({
        userId,
        status: { $in: ['new', 'investigating', 'confirmed'] },
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      socket.emit('dashboard:threat-summary', {
        activeThreats: threatCount,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error sending dashboard update:', error);
    }
  }

  updateUserActivity(userId) {
    const user = this.connectedUsers.get(userId);
    if (user) {
      user.lastActivity = new Date();
      this.connectedUsers.set(userId, user);
    }
  }

  canJoinTeam(userRole, teamId) {
    // Implement team access control logic
    return ['admin', 'enterprise'].includes(userRole);
  }

  handleDisconnection(socket) {
    const userId = socket.userId;
    
    console.log(`User ${socket.userEmail} disconnected - Socket ID: ${socket.id}`);
    
    // Remove user from connected users
    this.connectedUsers.delete(userId);
    this.activeConnections = Math.max(0, this.activeConnections - 1);
    
    // Clean up any user-specific subscriptions
    // This is handled automatically by socket.io room cleanup
  }

  // Public methods for other services to emit events

  notifyThreatDetected(userId, threat) {
    this.io.to(`user:${userId}`).emit('threat:detected', threat);
    
    // Also notify dashboard subscribers
    this.io.to(`dashboard:${userId}`).emit('dashboard:new-threat', {
      id: threat._id,
      severity: threat.severity,
      title: threat.title,
      timestamp: threat.createdAt
    });
  }

  notifyScanProgress(userId, scanId, progress) {
    this.io.to(`user:${userId}`).emit('scan:progress', {
      scanId,
      progress,
      timestamp: new Date()
    });
  }

  notifyScanCompleted(userId, scanId, results) {
    this.io.to(`user:${userId}`).emit('scan:completed', {
      scanId,
      results,
      timestamp: new Date()
    });
  }

  notifySecurityScoreUpdate(userId, scoreData) {
    this.io.to(`dashboard:${userId}`).emit('dashboard:security-score', scoreData);
  }

  broadcastSystemAlert(message, severity = 'info') {
    this.io.emit('system:alert', {
      message,
      severity,
      timestamp: new Date()
    });
  }

  notifyMonitoringEvent(target, eventData) {
    this.io.to(`monitor:${target}`).emit('monitor:event', eventData);
  }

  // Admin/management methods

  getConnectedUsers() {
    return Array.from(this.connectedUsers.values());
  }

  getActiveConnectionCount() {
    return this.activeConnections;
  }

  disconnectUser(userId) {
    const user = this.connectedUsers.get(userId);
    if (user) {
      const socket = this.io.sockets.sockets.get(user.socketId);
      if (socket) {
        socket.disconnect(true);
      }
    }
  }

  sendToUser(userId, event, data) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  sendToRole(role, event, data) {
    this.io.to(`role:${role}`).emit(event, data);
  }

  sendToAll(event, data) {
    this.io.emit(event, data);
  }
}

module.exports = function(io) {
  const handler = new WebSocketHandler();
  handler.initialize(io);
  return handler;
};