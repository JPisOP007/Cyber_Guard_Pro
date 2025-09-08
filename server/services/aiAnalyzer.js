const axios = require('axios');

class AIAnalyzer {
  constructor() {
    this.initialized = false;
    this.models = {
      threatClassification: 'basic-threat-classifier',
      vulnerabilityAssessment: 'vuln-assessment-model',
      phishingDetection: 'phishing-detector'
    };
  }

  async initialize() {
    try {
      console.log('Initializing AI Analyzer...');
      // In a real implementation, this would initialize ML models
      // For now, we'll use rule-based analysis
      this.initialized = true;
      console.log('AI Analyzer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI Analyzer:', error);
      throw error;
    }
  }

  /**
   * Analyze threat data and classify threat level
   */
  async analyzeThreat(threatData) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const analysis = {
        threatId: threatData.id || Date.now().toString(),
        classification: this.classifyThreat(threatData),
        riskScore: this.calculateRiskScore(threatData),
        recommendation: this.generateRecommendation(threatData),
        confidence: this.calculateConfidence(threatData),
        indicators: this.extractIndicators(threatData),
        mitigationSteps: this.generateMitigationSteps(threatData)
      };

      return analysis;
    } catch (error) {
      console.error('Threat analysis error:', error);
      throw new Error(`Failed to analyze threat: ${error.message}`);
    }
  }

  /**
   * Analyze vulnerability scan results
   */
  async analyzeVulnerabilities(scanResults) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const vulnerabilities = scanResults.vulnerabilities || [];
      
      const analysis = {
        scanId: scanResults.id,
        totalVulnerabilities: vulnerabilities.length,
        severityBreakdown: this.analyzeSeverityBreakdown(vulnerabilities),
        criticalFindings: this.identifyCriticalFindings(vulnerabilities),
        riskScore: this.calculateVulnerabilityRiskScore(vulnerabilities),
        prioritizedRemediation: this.prioritizeRemediation(vulnerabilities),
        complianceStatus: this.assessCompliance(vulnerabilities),
        trendAnalysis: this.analyzeTrends(scanResults)
      };

      return analysis;
    } catch (error) {
      console.error('Vulnerability analysis error:', error);
      throw new Error(`Failed to analyze vulnerabilities: ${error.message}`);
    }
  }

  /**
   * Detect phishing attempts
   */
  async detectPhishing(content) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const indicators = this.extractPhishingIndicators(content);
      const score = this.calculatePhishingScore(indicators);
      
      return {
        isPhishing: score > 0.7,
        confidenceScore: score,
        indicators: indicators,
        riskLevel: this.categorizePhishingRisk(score),
        recommendation: this.generatePhishingRecommendation(score, indicators)
      };
    } catch (error) {
      console.error('Phishing detection error:', error);
      throw new Error(`Failed to detect phishing: ${error.message}`);
    }
  }

  /**
   * Generate security recommendations based on profile
   */
  async generateSecurityRecommendations(securityProfile) {
    try {
      const recommendations = [];
      const profile = securityProfile.profile || {};

      // Analyze current security posture
      const riskAreas = this.identifyRiskAreas(profile);
      
      riskAreas.forEach(area => {
        const recommendation = this.createRecommendation(area, profile);
        if (recommendation) {
          recommendations.push(recommendation);
        }
      });

      // Sort by priority
      recommendations.sort((a, b) => b.priority - a.priority);

      return {
        recommendations: recommendations.slice(0, 10), // Top 10 recommendations
        overallRiskLevel: this.calculateOverallRisk(profile),
        improvementAreas: riskAreas,
        securityScore: securityProfile.securityScore || 0
      };
    } catch (error) {
      console.error('Security recommendations error:', error);
      throw new Error(`Failed to generate recommendations: ${error.message}`);
    }
  }

  // Private helper methods

  classifyThreat(threatData) {
    const { type, severity, source } = threatData;
    
    if (severity >= 8) return 'CRITICAL';
    if (severity >= 6) return 'HIGH';
    if (severity >= 4) return 'MEDIUM';
    return 'LOW';
  }

  calculateRiskScore(threatData) {
    let score = 0;
    
    // Base severity
    score += (threatData.severity || 1) * 10;
    
    // Source credibility
    if (threatData.source === 'VirusTotal') score += 20;
    if (threatData.source === 'Shodan') score += 15;
    
    // Threat type multiplier
    const typeMultipliers = {
      'malware': 1.5,
      'phishing': 1.3,
      'ransomware': 2.0,
      'vulnerability': 1.2,
      'breach': 1.8
    };
    
    score *= typeMultipliers[threatData.type] || 1.0;
    
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  generateRecommendation(threatData) {
    const recommendations = {
      'malware': 'Update antivirus software and perform full system scan',
      'phishing': 'Avoid clicking suspicious links and verify sender authenticity',
      'ransomware': 'Ensure backups are up-to-date and disconnect from network if infected',
      'vulnerability': 'Apply security patches and updates immediately',
      'breach': 'Change passwords and monitor accounts for unauthorized access'
    };
    
    return recommendations[threatData.type] || 'Monitor the situation and follow security best practices';
  }

  calculateConfidence(threatData) {
    let confidence = 0.5; // Base confidence
    
    if (threatData.source) confidence += 0.2;
    if (threatData.verified) confidence += 0.3;
    if (threatData.signatures && threatData.signatures.length > 0) confidence += 0.2;
    
    return Math.min(1.0, confidence);
  }

  extractIndicators(threatData) {
    const indicators = [];
    
    if (threatData.ip) indicators.push({ type: 'IP', value: threatData.ip });
    if (threatData.domain) indicators.push({ type: 'Domain', value: threatData.domain });
    if (threatData.hash) indicators.push({ type: 'Hash', value: threatData.hash });
    if (threatData.url) indicators.push({ type: 'URL', value: threatData.url });
    
    return indicators;
  }

  generateMitigationSteps(threatData) {
    const baseSteps = [
      'Monitor affected systems',
      'Update security policies',
      'Notify relevant stakeholders'
    ];
    
    const typeSpecificSteps = {
      'malware': [
        'Isolate infected systems',
        'Run antimalware scans',
        'Check for lateral movement'
      ],
      'phishing': [
        'Block malicious domains',
        'Educate users about phishing',
        'Implement email filtering'
      ],
      'vulnerability': [
        'Apply security patches',
        'Scan for exploitation attempts',
        'Review access controls'
      ]
    };
    
    return [...baseSteps, ...(typeSpecificSteps[threatData.type] || [])];
  }

  analyzeSeverityBreakdown(vulnerabilities) {
    const breakdown = { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 };
    
    vulnerabilities.forEach(vuln => {
      breakdown[vuln.severity] = (breakdown[vuln.severity] || 0) + 1;
    });
    
    return breakdown;
  }

  identifyCriticalFindings(vulnerabilities) {
    return vulnerabilities
      .filter(vuln => vuln.severity === 'Critical' || vuln.cvssScore >= 9.0)
      .sort((a, b) => (b.cvssScore || 0) - (a.cvssScore || 0))
      .slice(0, 5);
  }

  calculateVulnerabilityRiskScore(vulnerabilities) {
    if (vulnerabilities.length === 0) return 0;
    
    const severityScores = { Critical: 10, High: 7, Medium: 4, Low: 2, Info: 1 };
    const totalScore = vulnerabilities.reduce((sum, vuln) => {
      return sum + (severityScores[vuln.severity] || 1);
    }, 0);
    
    // Normalize to 0-100 scale
    return Math.min(100, Math.round((totalScore / vulnerabilities.length) * 10));
  }

  prioritizeRemediation(vulnerabilities) {
    return vulnerabilities
      .map(vuln => ({
        ...vuln,
        priority: this.calculateRemediationPriority(vuln)
      }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10);
  }

  calculateRemediationPriority(vulnerability) {
    let priority = 0;
    
    // CVSS score weight
    priority += (vulnerability.cvssScore || 0) * 10;
    
    // Exploitability weight
    if (vulnerability.exploitable) priority += 25;
    
    // Public exploit availability
    if (vulnerability.publicExploit) priority += 20;
    
    // Asset criticality
    if (vulnerability.assetCriticality === 'high') priority += 15;
    
    return Math.round(priority);
  }

  assessCompliance(vulnerabilities) {
    // Mock compliance assessment
    const criticalCount = vulnerabilities.filter(v => v.severity === 'Critical').length;
    const highCount = vulnerabilities.filter(v => v.severity === 'High').length;
    
    return {
      pciDss: criticalCount === 0 && highCount <= 2,
      hipaa: criticalCount === 0,
      sox: highCount <= 1,
      iso27001: vulnerabilities.length <= 50
    };
  }

  analyzeTrends(scanResults) {
    // Mock trend analysis - in real implementation, compare with historical data
    return {
      vulnerabilityTrend: 'stable',
      riskTrend: 'improving',
      newVulnerabilities: Math.floor(Math.random() * 5),
      resolvedVulnerabilities: Math.floor(Math.random() * 3)
    };
  }

  extractPhishingIndicators(content) {
    const indicators = [];
    const text = content.text || content.subject || '';
    const url = content.url || '';
    const sender = content.sender || '';
    
    // Urgency indicators
    const urgencyWords = ['urgent', 'immediate', 'expires', 'suspend', 'verify now'];
    if (urgencyWords.some(word => text.toLowerCase().includes(word))) {
      indicators.push({ type: 'urgency', weight: 0.3 });
    }
    
    // Generic greetings
    if (/dear (customer|user|sir|madam)/i.test(text)) {
      indicators.push({ type: 'generic_greeting', weight: 0.2 });
    }
    
    // Suspicious URLs
    if (url && (url.includes('bit.ly') || url.includes('tinyurl') || url.match(/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/))) {
      indicators.push({ type: 'suspicious_url', weight: 0.4 });
    }
    
    // Domain spoofing
    if (sender && this.isDomainSuspicious(sender)) {
      indicators.push({ type: 'domain_spoofing', weight: 0.5 });
    }
    
    return indicators;
  }

  calculatePhishingScore(indicators) {
    return indicators.reduce((score, indicator) => score + indicator.weight, 0);
  }

  categorizePhishingRisk(score) {
    if (score >= 0.8) return 'CRITICAL';
    if (score >= 0.6) return 'HIGH';
    if (score >= 0.4) return 'MEDIUM';
    return 'LOW';
  }

  generatePhishingRecommendation(score, indicators) {
    if (score >= 0.7) {
      return 'High probability of phishing. Do not click links or provide information. Report to security team.';
    } else if (score >= 0.4) {
      return 'Suspicious content detected. Verify sender through alternative means before taking action.';
    }
    return 'Content appears safe, but always exercise caution with unsolicited emails.';
  }

  isDomainSuspicious(sender) {
    const commonSpoofs = [
      'microsofft', 'googlle', 'amazom', 'paypaI', 'bankofamerica'
    ];
    
    return commonSpoofs.some(spoof => sender.toLowerCase().includes(spoof));
  }

  identifyRiskAreas(profile) {
    const riskAreas = [];
    
    if (!profile.hasAntivirus) riskAreas.push('antivirus');
    if (!profile.hasFirewall) riskAreas.push('firewall');
    if (!profile.regularUpdates) riskAreas.push('updates');
    if (!profile.passwordManager) riskAreas.push('password_management');
    if (!profile.twoFactorAuth) riskAreas.push('2fa');
    if (!profile.dataBackup) riskAreas.push('backup');
    
    return riskAreas;
  }

  createRecommendation(riskArea, profile) {
    const recommendations = {
      'antivirus': {
        title: 'Install Antivirus Software',
        description: 'Deploy enterprise-grade antivirus solution',
        priority: 9,
        effort: 'Low',
        impact: 'High'
      },
      'firewall': {
        title: 'Enable Firewall Protection',
        description: 'Configure and maintain network firewall',
        priority: 8,
        effort: 'Medium',
        impact: 'High'
      },
      'updates': {
        title: 'Regular Security Updates',
        description: 'Implement automated update management',
        priority: 7,
        effort: 'Low',
        impact: 'Medium'
      },
      'password_management': {
        title: 'Deploy Password Manager',
        description: 'Use enterprise password management solution',
        priority: 8,
        effort: 'Medium',
        impact: 'High'
      },
      '2fa': {
        title: 'Enable Two-Factor Authentication',
        description: 'Implement 2FA for all critical accounts',
        priority: 9,
        effort: 'Medium',
        impact: 'High'
      },
      'backup': {
        title: 'Implement Data Backup',
        description: 'Set up automated, secure data backup',
        priority: 7,
        effort: 'High',
        impact: 'High'
      }
    };
    
    return recommendations[riskArea];
  }

  calculateOverallRisk(profile) {
    const riskFactors = this.identifyRiskAreas(profile);
    const riskScore = riskFactors.length * 15; // Each risk area adds 15 points
    
    if (riskScore >= 70) return 'CRITICAL';
    if (riskScore >= 50) return 'HIGH';
    if (riskScore >= 30) return 'MEDIUM';
    return 'LOW';
  }
}

module.exports = new AIAnalyzer();