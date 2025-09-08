const mongoose = require('mongoose');

const threatAlertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false  // Allow system-generated alerts without a specific user
  },
  alertId: {
    type: String,
    required: true,
    unique: true
  },
  source: {
    type: String,
    enum: ['internal-scan', 'virustotal', 'shodan', 'hibp', 'threat-feed', 'user-report', 'ai-analysis', 'network-monitor', 'system-generated'],
    required: true
  },
  type: {
    type: String,
    enum: ['malware', 'phishing', 'data-breach', 'vulnerability', 'suspicious-activity', 'policy-violation', 'compliance-issue', 'failed-auth', 'network-anomaly', 'system-alert'],
    required: true
  },
  severity: {
    type: String,
    enum: ['info', 'low', 'medium', 'high', 'critical'],
    required: true,
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['new', 'investigating', 'confirmed', 'false-positive', 'resolved', 'ignored'],
    default: 'new'
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  
  // Alert details
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  details: {
    // Flexible object for threat-specific details
    target: String, // IP, domain, email, etc.
    attackVector: String,
    payload: String,
    indicators: [String], // IOCs (Indicators of Compromise)
    ttps: [String], // Tactics, Techniques, and Procedures
    mitre: [String], // MITRE ATT&CK framework references
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },
    rawData: mongoose.Schema.Types.Mixed
  },
  
  // Geolocation and network info
  location: {
    country: String,
    region: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    isp: String,
    organization: String
  },
  
  network: {
    sourceIp: String,
    destinationIp: String,
    sourcePort: Number,
    destinationPort: Number,
    protocol: String,
    userAgent: String,
    referrer: String
  },
  
  // Timeline
  firstSeen: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  detectedAt: {
    type: Date,
    default: Date.now
  },
  
  // Actions taken
  actions: [{
    type: {
      type: String,
      enum: ['block-ip', 'quarantine-file', 'notify-admin', 'escalate', 'investigate', 'whitelist', 'create-rule'],
      required: true
    },
    description: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    automated: {
      type: Boolean,
      default: false
    },
    result: {
      success: Boolean,
      message: String,
      data: mongoose.Schema.Types.Mixed
    }
  }],
  
  // Related entities
  relatedAlerts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ThreatAlert'
  }],
  
  relatedAssets: [{
    type: String, // Asset identifier
    name: String,
    assetType: {
      type: String,
      enum: ['server', 'workstation', 'mobile', 'iot', 'application', 'database', 'network-device']
    }
  }],
  
  affectedUsers: [{
    email: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    impact: {
      type: String,
      enum: ['none', 'low', 'medium', 'high', 'critical'],
      default: 'medium'
    }
  }],
  
  // Investigation and analysis
  investigation: {
    assigned: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: Date,
    dueDate: Date,
    findings: String,
    recommendations: String,
    evidenceFiles: [String], // URLs to evidence files
    timeline: [{
      timestamp: Date,
      event: String,
      details: String,
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },
  
  // Compliance and reporting
  compliance: {
    reportRequired: {
      type: Boolean,
      default: false
    },
    frameworks: [String], // Which frameworks require reporting
    reportedTo: [String], // Authorities notified
    reportDate: Date,
    reportNumber: String
  },
  
  // Machine learning and AI analysis
  aiAnalysis: {
    analyzed: {
      type: Boolean,
      default: false
    },
    analyzedAt: Date,
    riskScore: {
      type: Number,
      min: 0,
      max: 100
    },
    prediction: {
      type: String,
      enum: ['benign', 'suspicious', 'malicious', 'unknown'],
      default: 'unknown'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100
    },
    features: mongoose.Schema.Types.Mixed,
    modelVersion: String
  },
  
  // Notifications and communications
  notifications: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push', 'webhook', 'slack', 'teams']
    },
    recipients: [String],
    template: String,
    sentAt: Date,
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'bounced'],
      default: 'pending'
    },
    response: mongoose.Schema.Types.Mixed
  }],
  
  // Metrics and feedback
  metrics: {
    views: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    feedback: [{
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      submittedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Archival and cleanup
  archived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Tags and categorization
  tags: [String],
  customFields: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes for performance
threatAlertSchema.index({ userId: 1, createdAt: -1 });
threatAlertSchema.index({ alertId: 1 });
threatAlertSchema.index({ status: 1, severity: -1 });
threatAlertSchema.index({ type: 1, createdAt: -1 });
threatAlertSchema.index({ 'details.target': 1 });
threatAlertSchema.index({ firstSeen: -1 });
threatAlertSchema.index({ tags: 1 });

// Virtual for alert age
threatAlertSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for time to resolution
threatAlertSchema.virtual('timeToResolution').get(function() {
  if (this.status === 'resolved' && this.updatedAt) {
    return this.updatedAt.getTime() - this.createdAt.getTime();
  }
  return null;
});

// Method to escalate alert
threatAlertSchema.methods.escalate = function(reason, userId) {
  if (this.priority < 5) {
    this.priority += 1;
  }
  
  this.actions.push({
    type: 'escalate',
    description: reason || 'Alert escalated',
    performedBy: userId,
    performedAt: new Date(),
    automated: false,
    result: {
      success: true,
      message: `Priority increased to ${this.priority}`,
      data: { previousPriority: this.priority - 1, newPriority: this.priority }
    }
  });
  
  return this.save();
};

// Method to resolve alert
threatAlertSchema.methods.resolve = function(resolution, userId) {
  this.status = 'resolved';
  
  this.actions.push({
    type: 'investigate',
    description: resolution || 'Alert resolved',
    performedBy: userId,
    performedAt: new Date(),
    automated: false,
    result: {
      success: true,
      message: 'Alert marked as resolved',
      data: { resolution }
    }
  });
  
  return this.save();
};

// Method to add related alert
threatAlertSchema.methods.linkAlert = function(alertId) {
  if (!this.relatedAlerts.includes(alertId)) {
    this.relatedAlerts.push(alertId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to update AI analysis
threatAlertSchema.methods.updateAiAnalysis = function(analysisData) {
  this.aiAnalysis = {
    ...this.aiAnalysis,
    ...analysisData,
    analyzed: true,
    analyzedAt: new Date()
  };
  return this.save();
};

// Method to record view
threatAlertSchema.methods.recordView = function() {
  this.metrics.views += 1;
  return this.save();
};

// Static method to get alerts by severity
threatAlertSchema.statics.getBySeverity = function(userId, severity) {
  return this.find({ userId, severity }).sort({ createdAt: -1 });
};

// Static method to get active alerts
threatAlertSchema.statics.getActiveAlerts = function(userId) {
  return this.find({ 
    userId, 
    status: { $in: ['new', 'investigating', 'confirmed'] },
    archived: false
  }).sort({ priority: -1, createdAt: -1 });
};

// Pre-save middleware to update lastSeen
threatAlertSchema.pre('save', function(next) {
  if (this.isModified('status') || this.isNew) {
    this.lastSeen = new Date();
  }
  next();
});

module.exports = mongoose.model('ThreatAlert', threatAlertSchema);