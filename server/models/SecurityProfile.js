const mongoose = require('mongoose');

const securityProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  securityScore: {
    overall: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },
    components: {
      vulnerabilities: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
      },
      threats: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
      },
      compliance: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
      },
      training: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      }
    },
    history: [{
      date: {
        type: Date,
        default: Date.now
      },
      score: Number,
      reason: String
    }]
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  assets: {
    domains: [{
      domain: String,
      verified: {
        type: Boolean,
        default: false
      },
      lastScanned: Date,
      status: {
        type: String,
        enum: ['active', 'inactive', 'error'],
        default: 'active'
      }
    }],
    ipRanges: [{
      range: String,
      description: String,
      lastScanned: Date,
      status: {
        type: String,
        enum: ['active', 'inactive', 'error'],
        default: 'active'
      }
    }],
    applications: [{
      name: String,
      type: String,
      version: String,
      url: String,
      criticality: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
      },
      lastScanned: Date,
      status: {
        type: String,
        enum: ['active', 'inactive', 'error'],
        default: 'active'
      }
    }]
  },
  scanSettings: {
    frequency: {
      type: String,
      enum: ['manual', 'daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    scanTypes: [{
      type: String,
      enum: ['vulnerability', 'port', 'ssl', 'dns', 'malware', 'phishing']
    }],
    notifications: {
      immediate: {
        type: Boolean,
        default: true
      },
      summary: {
        type: Boolean,
        default: true
      },
      threshold: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
      }
    },
    exclusions: [{
      type: String, // IP, domain, or pattern to exclude
      reason: String
    }]
  },
  complianceFrameworks: [{
    name: {
      type: String,
      enum: ['ISO27001', 'NIST', 'SOC2', 'GDPR', 'HIPAA', 'PCI-DSS']
    },
    status: {
      type: String,
      enum: ['compliant', 'partial', 'non-compliant', 'unknown'],
      default: 'unknown'
    },
    lastAssessment: Date,
    requirements: [{
      id: String,
      description: String,
      status: {
        type: String,
        enum: ['met', 'partial', 'not-met', 'not-applicable'],
        default: 'unknown'
      },
      evidence: String,
      lastUpdated: Date
    }]
  }],
  integrations: {
    siem: {
      enabled: {
        type: Boolean,
        default: false
      },
      endpoint: String,
      apiKey: String,
      lastSync: Date
    },
    ticketing: {
      enabled: {
        type: Boolean,
        default: false
      },
      system: String, // jira, servicenow, etc.
      endpoint: String,
      credentials: String,
      projectKey: String
    },
    slack: {
      enabled: {
        type: Boolean,
        default: false
      },
      webhook: String,
      channel: String
    },
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      recipients: [String],
      templates: {
        vulnerability: String,
        threat: String,
        summary: String
      }
    }
  },
  metrics: {
    totalScans: {
      type: Number,
      default: 0
    },
    vulnerabilitiesFound: {
      type: Number,
      default: 0
    },
    vulnerabilitiesResolved: {
      type: Number,
      default: 0
    },
    threatsDetected: {
      type: Number,
      default: 0
    },
    threatsBlocked: {
      type: Number,
      default: 0
    },
    trainingCompleted: {
      type: Number,
      default: 0
    },
    lastActivityDate: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Indexes
securityProfileSchema.index({ userId: 1 });
securityProfileSchema.index({ 'securityScore.overall': -1 });
securityProfileSchema.index({ riskLevel: 1 });

// Virtual for risk assessment
securityProfileSchema.virtual('riskAssessment').get(function() {
  const score = this.securityScore.overall;
  if (score >= 80) return 'low';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'high';
  return 'critical';
});

// Method to update security score
securityProfileSchema.methods.updateSecurityScore = function(component, score, reason) {
  if (this.securityScore.components[component] !== undefined) {
    this.securityScore.components[component] = score;
  }
  
  // Calculate overall score (weighted average)
  const weights = {
    vulnerabilities: 0.3,
    threats: 0.3,
    compliance: 0.2,
    training: 0.2
  };
  
  let totalScore = 0;
  let totalWeight = 0;
  
  Object.keys(weights).forEach(comp => {
    if (this.securityScore.components[comp] !== undefined) {
      totalScore += this.securityScore.components[comp] * weights[comp];
      totalWeight += weights[comp];
    }
  });
  
  this.securityScore.overall = Math.round(totalScore / totalWeight);
  this.riskLevel = this.riskAssessment;
  
  // Add to history
  this.securityScore.history.push({
    date: new Date(),
    score: this.securityScore.overall,
    reason: reason || 'Score updated'
  });
  
  // Keep only last 100 history entries
  if (this.securityScore.history.length > 100) {
    this.securityScore.history = this.securityScore.history.slice(-100);
  }
  
  this.metrics.lastActivityDate = new Date();
  
  return this.save();
};

// Method to add asset
securityProfileSchema.methods.addAsset = function(type, assetData) {
  if (this.assets[type]) {
    this.assets[type].push(assetData);
    return this.save();
  }
  throw new Error(`Invalid asset type: ${type}`);
};

// Method to update metrics
securityProfileSchema.methods.updateMetrics = function(metricType, increment = 1) {
  if (this.metrics[metricType] !== undefined) {
    this.metrics[metricType] += increment;
    this.metrics.lastActivityDate = new Date();
    return this.save();
  }
  throw new Error(`Invalid metric type: ${metricType}`);
};

module.exports = mongoose.model('SecurityProfile', securityProfileSchema);