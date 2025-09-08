const ThreatAlert = require('../models/ThreatAlert');
const VulnerabilityReport = require('../models/VulnerabilityReport');
const SecurityProfile = require('../models/SecurityProfile');

class RealTimeMetrics {
  constructor() {
    this.metrics = {
      activeThreats: 0,
      criticalAlerts: 0,
      systemHealth: 100,
      networkActivity: 0,
      threatTrends: [],
      severityDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
      sourceBreakdown: {},
      recentActivity: []
    };
    
    this.subscribers = new Set();
    this.updateInterval = null;
  }

  initialize() {
    console.log('Real-time metrics service initialized');
    this.startMetricsCollection();
  }

  startMetricsCollection() {
    // Update metrics every 30 seconds
    this.updateInterval = setInterval(async () => {
      await this.updateMetrics();
      this.broadcastMetrics();
    }, 30000);

    // Initial update
    this.updateMetrics();
  }

  async updateMetrics() {
    try {
      // Get active threats count
      const activeThreats = await ThreatAlert.countDocuments({
        status: { $in: ['new', 'investigating', 'confirmed'] }
      });

      // Get critical alerts count
      const criticalAlerts = await ThreatAlert.countDocuments({
        severity: 'critical',
        status: { $in: ['new', 'investigating', 'confirmed'] }
      });

      // Get severity distribution for last 24 hours
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const severityAggregation = await ThreatAlert.aggregate([
        { $match: { createdAt: { $gte: last24Hours } } },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]);

      const severityDistribution = { low: 0, medium: 0, high: 0, critical: 0 };
      severityAggregation.forEach(item => {
        severityDistribution[item._id] = item.count;
      });

      // Get source breakdown
      const sourceAggregation = await ThreatAlert.aggregate([
        { $match: { createdAt: { $gte: last24Hours } } },
        { $group: { _id: '$source', count: { $sum: 1 } } }
      ]);

      const sourceBreakdown = {};
      sourceAggregation.forEach(item => {
        sourceBreakdown[item._id] = item.count;
      });

      // Get recent activity (last 10 threats)
      const recentActivity = await ThreatAlert.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('title severity source createdAt')
        .lean();

      // Generate threat trends (hourly data for last 24 hours)
      const threatTrends = await this.generateThreatTrends();

      // Calculate system health score
      const systemHealth = await this.calculateSystemHealth();

      // Simulate network activity (in real implementation, this would come from network monitors)
      const networkActivity = Math.floor(Math.random() * 1000) + 500;

      this.metrics = {
        activeThreats,
        criticalAlerts,
        systemHealth,
        networkActivity,
        threatTrends,
        severityDistribution,
        sourceBreakdown,
        recentActivity,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error updating real-time metrics:', error);
    }
  }

  async generateThreatTrends() {
    try {
      const trends = [];
      const now = new Date();
      
      // Generate hourly data for the last 24 hours
      for (let i = 23; i >= 0; i--) {
        const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
        
        const hourlyThreats = await ThreatAlert.countDocuments({
          createdAt: { $gte: hourStart, $lt: hourEnd }
        });

        trends.push({
          timestamp: hourStart.toISOString(),
          threats: hourlyThreats,
          hour: hourStart.getHours()
        });
      }
      
      return trends;
    } catch (error) {
      console.error('Error generating threat trends:', error);
      return [];
    }
  }

  async calculateSystemHealth() {
    try {
      let health = 100;
      
      // Reduce health based on critical threats
      const criticalThreats = await ThreatAlert.countDocuments({
        severity: 'critical',
        status: { $in: ['new', 'investigating'] }
      });
      health -= criticalThreats * 5;

      // Reduce health based on high severity threats
      const highThreats = await ThreatAlert.countDocuments({
        severity: 'high',
        status: { $in: ['new', 'investigating'] }
      });
      health -= highThreats * 2;

      // Reduce health based on unresolved threats older than 24 hours
      const oldThreats = await ThreatAlert.countDocuments({
        status: { $in: ['new', 'investigating'] },
        createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
      health -= oldThreats * 3;

      return Math.max(0, Math.min(100, health));
    } catch (error) {
      console.error('Error calculating system health:', error);
      return 85; // Default health score
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    // Send current metrics immediately to new subscriber
    callback(this.metrics);
  }

  unsubscribe(callback) {
    this.subscribers.delete(callback);
  }

  broadcastMetrics() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.metrics);
      } catch (error) {
        console.error('Error broadcasting metrics to subscriber:', error);
      }
    });

    // Also broadcast via WebSocket if available
    if (global.io) {
      global.io.emit('realtime-metrics', this.metrics);
    }
  }

  getCurrentMetrics() {
    return this.metrics;
  }

  // Method to trigger immediate metrics update
  async forceUpdate() {
    await this.updateMetrics();
    this.broadcastMetrics();
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.subscribers.clear();
    console.log('Real-time metrics service stopped');
  }
}

module.exports = new RealTimeMetrics();