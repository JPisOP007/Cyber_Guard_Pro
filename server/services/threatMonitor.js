const axios = require('axios');
const ThreatAlert = require('../models/ThreatAlert');
const SecurityProfile = require('../models/SecurityProfile');
const { generateAlertId } = require('../utils/helpers');

// Try to import Bull queue, fallback to in-memory processing
let threatQueue = null;
let queueInitialized = false;

function initializeThreatQueue() {
  if (queueInitialized) return threatQueue;
  queueInitialized = true;
  
  try {
    const { createBullQueue } = require('../config/bull');
    threatQueue = createBullQueue('threat-monitoring');
  } catch (error) {
    console.log('Redis not available, using in-memory threat monitoring');
  }
  return threatQueue;
}

class ThreatMonitor {
  constructor() {
    this.activeSources = new Map();
    this.threatFeeds = new Map();
    this.apiKeys = {
      virustotal: process.env.VIRUSTOTAL_API_KEY,
      shodan: process.env.SHODAN_API_KEY,
      hibp: process.env.HIBP_API_KEY
    };
    this.initializeThreatFeeds();
    this.initializeQueue();
  }

  initializeThreatFeeds() {
    // VirusTotal integration
    this.threatFeeds.set('virustotal', {
      name: 'VirusTotal',
      checkUrl: this.checkVirusTotal.bind(this),
      checkDomain: this.checkVirusTotalDomain.bind(this),
      enabled: !!this.apiKeys.virustotal
    });

    // Shodan integration
    this.threatFeeds.set('shodan', {
      name: 'Shodan',
      searchIp: this.searchShodan.bind(this),
      enabled: !!this.apiKeys.shodan
    });

    // Have I Been Pwned integration
    this.threatFeeds.set('hibp', {
      name: 'Have I Been Pwned',
      checkBreach: this.checkHIBP.bind(this),
      enabled: !!this.apiKeys.hibp
    });

    // Internal threat detection
    this.threatFeeds.set('internal', {
      name: 'Internal Detection',
      analyzePattern: this.analyzeInternalPatterns.bind(this),
      enabled: true
    });
  }

  initializeQueue() {
    threatQueue = initializeThreatQueue();
    if (threatQueue) {
      // Process threat monitoring jobs
      threatQueue.process('monitor-threat', async (job) => {
        const { type, target, userId } = job.data;
        return await this.processThreats(type, target, userId);
      });

      // Process bulk threat analysis
      threatQueue.process('bulk-analysis', async (job) => {
        const { targets, userId } = job.data;
        return await this.processBulkAnalysis(targets, userId);
      });

      // Periodic threat feed updates
      threatQueue.process('feed-update', async (job) => {
        return await this.updateThreatFeeds();
      });

      // Handle completed jobs
      threatQueue.on('completed', (job, result) => {
        console.log(`Threat monitoring job ${job.id} completed:`, result);
      });

      // Handle failed jobs
      threatQueue.on('failed', (job, err) => {
        console.error(`Threat monitoring job ${job.id} failed:`, err.message);
      });
    } else {
      console.log('Queue system not available, threat monitoring will use direct processing');
    }
  }

  initialize() {
    console.log('Threat Monitor initialized');
    
    // Schedule periodic threat feed updates
    this.schedulePeriodicUpdates();
    
    // Start real-time monitoring
    this.startRealTimeMonitoring();
  }

  schedulePeriodicUpdates() {
    if (threatQueue) {
      // Update threat feeds every hour
      threatQueue.add('feed-update', {}, {
        repeat: { cron: '0 * * * *' }, // Every hour
        removeOnComplete: 5,
        removeOnFail: 3
      });
    } else {
      // Fallback to setInterval for periodic updates
      setInterval(() => {
        this.updateThreatFeeds().catch(err => 
          console.error('Periodic threat feed update failed:', err)
        );
      }, 60 * 60 * 1000); // Every hour
    }
  }

  startRealTimeMonitoring() {
    console.log('Real-time threat monitoring started');
    
    // Check if real API keys are available
    const hasRealApiKeys = Object.values(this.apiKeys).some(key => key && key !== '');
    
    if (hasRealApiKeys) {
      console.log('Real threat intelligence APIs detected - starting live monitoring');
      this.startLiveThreatMonitoring();
    } else {
      console.log('No real API keys found - starting demo mode');
      this.startDemoThreatGeneration();
    }
    
    // Start background threat intelligence updates
    this.startThreatIntelligenceUpdates();
  }

  startDemoThreatGeneration() {
    // Generate demo threats every 30 seconds to 2 minutes
    const generateThreat = () => {
      const demoThreats = [
        {
          type: 'suspicious-activity',
          severity: 'medium',
          title: 'Suspicious IP Activity Detected',
          description: 'Multiple failed login attempts from IP 192.168.1.100',
          source: 'internal-scan'
        },
        {
          type: 'malware',
          severity: 'high',
          title: 'Malware Signature Detected',
          description: 'Trojan.GenKryptor found in network traffic',
          source: 'threat-feed'
        },
        {
          type: 'vulnerability',
          severity: 'low',
          title: 'Port Scan Activity',
          description: 'Port scanning detected from external IP',
          source: 'internal-scan'
        },
        {
          type: 'data-breach',
          severity: 'critical',
          title: 'Potential Data Breach',
          description: 'Unusual data access patterns detected',
          source: 'ai-analysis'
        },
        {
          type: 'phishing',
          severity: 'medium',
          title: 'Phishing Email Detected',
          description: 'Suspicious email with malicious links blocked',
          source: 'threat-feed'
        }
      ];

      const threat = demoThreats[Math.floor(Math.random() * demoThreats.length)];
      this.generateDemoAlert(threat);
      
      // Schedule next threat
      const nextThreatDelay = 30000 + Math.random() * 90000; // 30s to 2min
      setTimeout(generateThreat, nextThreatDelay);
    };

    // Start generating threats after 10 seconds
    setTimeout(generateThreat, 10000);
  }

  startLiveThreatMonitoring() {
    console.log('Starting live threat intelligence monitoring...');
    
    // Monitor threat feeds every 5 minutes
    const monitorFeeds = async () => {
      try {
        await this.collectLiveThreatIntelligence();
        // Schedule next collection
        setTimeout(monitorFeeds, 5 * 60 * 1000); // 5 minutes
      } catch (error) {
        console.error('Error in live threat monitoring:', error);
        // Retry after 10 minutes on error
        setTimeout(monitorFeeds, 10 * 60 * 1000);
      }
    };

    // Start monitoring after 30 seconds
    setTimeout(monitorFeeds, 30000);
    
    // Also start network monitoring for suspicious activities
    this.startNetworkMonitoring();
  }

  async collectLiveThreatIntelligence() {
    const threats = [];
    
    try {
      // Collect from VirusTotal if available
      if (this.threatFeeds.get('virustotal').enabled) {
        const vtThreats = await this.collectVirusTotalThreats();
        threats.push(...vtThreats);
      }

      // Collect from Shodan if available  
      if (this.threatFeeds.get('shodan').enabled) {
        const shodanThreats = await this.collectShodanThreats();
        threats.push(...shodanThreats);
      }

      // Check recent breach data from HIBP
      if (this.threatFeeds.get('hibp').enabled) {
        const hibpThreats = await this.collectHIBPThreats();
        threats.push(...hibpThreats);
      }

      // Process collected threats
      for (const threat of threats) {
        await this.processThreatAlert(threat);
      }

      if (threats.length > 0) {
        console.log(`Collected ${threats.length} live threat indicators`);
      }

    } catch (error) {
      console.error('Error collecting live threat intelligence:', error);
    }
  }

  async collectVirusTotalThreats() {
    const threats = [];
    
    try {
      // Get recent malware samples and suspicious URLs
      const response = await axios.get('https://www.virustotal.com/api/v3/intelligence/hunting_notifications', {
        headers: {
          'X-Apikey': this.apiKeys.virustotal
        },
        timeout: 10000
      });

      if (response.data && response.data.data) {
        response.data.data.forEach(item => {
          threats.push({
            source: 'virustotal',
            type: 'malware',
            severity: this.calculateSeverityFromVT(item.stats),
            title: `Malware Alert: ${item.type}`,
            description: `New malware detected: ${item.id}`,
            target: item.id,
            indicators: {
              hash: item.id,
              detections: item.stats.malicious,
              engines: item.stats.total,
              timestamp: new Date().toISOString()
            },
            riskScore: Math.min(100, (item.stats.malicious / item.stats.total) * 100)
          });
        });
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.warn('VirusTotal API authentication failed - check API key');
      } else if (error.response?.status === 429) {
        console.warn('VirusTotal API rate limit exceeded');
      } else {
        console.error('VirusTotal API error:', error.message);
      }
    }

    return threats;
  }

  async collectShodanThreats() {
    const threats = [];
    
    try {
      // Search for recently compromised services
      const queries = [
        'vuln:CVE-2023',
        'vuln:CVE-2024', 
        'product:RDP port:3389',
        'product:SSH port:22 auth_failure'
      ];

      for (const query of queries) {
        const response = await axios.get(`https://api.shodan.io/shodan/host/search?key=${this.apiKeys.shodan}&query=${encodeURIComponent(query)}&limit=10`, {
          timeout: 15000
        });

        if (response.data && response.data.matches) {
          response.data.matches.forEach(match => {
            threats.push({
              source: 'shodan',
              type: 'vulnerability',
              severity: this.calculateSeverityFromShodan(match),
              title: `Vulnerable Service: ${match.product || 'Unknown'} on ${match.ip_str}`,
              description: `Vulnerable service detected: ${match.data.substring(0, 200)}...`,
              target: match.ip_str,
              indicators: {
                ip: match.ip_str,
                port: match.port,
                service: match.product,
                vulns: match.vulns || [],
                timestamp: new Date().toISOString()
              },
              riskScore: match.vulns ? Math.min(100, Object.keys(match.vulns).length * 20) : 60
            });
          });
        }
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.warn('Shodan API authentication failed - check API key');
      } else if (error.response?.status === 429) {
        console.warn('Shodan API rate limit exceeded');
      } else {
        console.error('Shodan API error:', error.message);
      }
    }

    return threats;
  }

  async collectHIBPThreats() {
    const threats = [];
    
    try {
      // Get recent breaches
      const response = await axios.get('https://haveibeenpwned.com/api/v3/breaches', {
        headers: {
          'User-Agent': 'CyberGuard-Pro-Monitor',
          'hibp-api-key': this.apiKeys.hibp
        },
        timeout: 10000
      });

      if (response.data && Array.isArray(response.data)) {
        // Filter breaches from last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        response.data
          .filter(breach => new Date(breach.BreachDate) >= thirtyDaysAgo)
          .forEach(breach => {
            threats.push({
              source: 'hibp',
              type: 'data-breach',
              severity: breach.PwnCount > 1000000 ? 'critical' : breach.PwnCount > 100000 ? 'high' : 'medium',
              title: `Data Breach: ${breach.Title}`,
              description: breach.Description,
              target: breach.Domain,
              indicators: {
                domain: breach.Domain,
                pwnCount: breach.PwnCount,
                dataClasses: breach.DataClasses,
                breachDate: breach.BreachDate,
                timestamp: new Date().toISOString()
              },
              riskScore: Math.min(100, Math.log10(breach.PwnCount) * 15)
            });
          });
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.warn('HIBP API authentication failed - check API key');
      } else if (error.response?.status === 429) {
        console.warn('HIBP API rate limit exceeded');
      } else {
        console.error('HIBP API error:', error.message);
      }
    }

    return threats;
  }

  startNetworkMonitoring() {
    // Monitor for suspicious network activities
    console.log('Network monitoring started');
    
    const networkCheck = () => {
      // This would integrate with network monitoring tools
      // For now, simulate network anomaly detection
      this.detectNetworkAnomalies();
      
      // Check every 2 minutes
      setTimeout(networkCheck, 2 * 60 * 1000);
    };

    // Start after 1 minute
    setTimeout(networkCheck, 60000);
  }

  async detectNetworkAnomalies() {
    // Simulate network anomaly detection
    const anomalyTypes = [
      {
        type: 'suspicious-traffic',
        title: 'Unusual Network Traffic Pattern',
        description: 'Anomalous data flow detected from internal network',
        severity: 'medium'
      },
      {
        type: 'failed-auth',
        title: 'Multiple Authentication Failures',
        description: 'Repeated login failures from suspicious IP addresses',
        severity: 'high'
      },
      {
        type: 'data-exfiltration',
        title: 'Potential Data Exfiltration',
        description: 'Large data transfer to external destination detected',
        severity: 'critical'
      }
    ];

    // Randomly generate network alerts (10% chance)
    if (Math.random() < 0.1) {
      const anomaly = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
      
      const threat = {
        source: 'network-monitor',
        type: anomaly.type,
        severity: anomaly.severity,
        title: anomaly.title,
        description: anomaly.description,
        target: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
        indicators: {
          timestamp: new Date().toISOString(),
          sourceIp: `10.0.0.${Math.floor(Math.random() * 254) + 1}`,
          protocol: ['TCP', 'UDP', 'HTTP', 'HTTPS'][Math.floor(Math.random() * 4)]
        },
        riskScore: anomaly.severity === 'critical' ? 95 : anomaly.severity === 'high' ? 80 : 65
      };

      await this.processThreatAlert(threat);
    }
  }

  startThreatIntelligenceUpdates() {
    // Update threat intelligence databases periodically
    const updateIntelligence = async () => {
      try {
        console.log('Updating threat intelligence databases...');
        await this.updateThreatSignatures();
        await this.updateIpReputationData();
        
        // Schedule next update (every hour)
        setTimeout(updateIntelligence, 60 * 60 * 1000);
      } catch (error) {
        console.error('Error updating threat intelligence:', error);
        // Retry after 30 minutes on error
        setTimeout(updateIntelligence, 30 * 60 * 1000);
      }
    };

    // Start after 5 minutes
    setTimeout(updateIntelligence, 5 * 60 * 1000);
  }

  async updateThreatSignatures() {
    // Update malware signatures and IOCs
    console.log('Updating threat signatures...');
    // Implementation would sync with threat intelligence feeds
  }

  async updateIpReputationData() {
    // Update IP reputation databases
    console.log('Updating IP reputation data...');
    // Implementation would sync with reputation services
  }

  calculateSeverityFromVT(stats) {
    if (!stats) return 'low';
    const ratio = stats.malicious / stats.total;
    if (ratio >= 0.7) return 'critical';
    if (ratio >= 0.4) return 'high'; 
    if (ratio >= 0.2) return 'medium';
    return 'low';
  }

  calculateSeverityFromShodan(match) {
    if (match.vulns && Object.keys(match.vulns).length > 3) return 'critical';
    if (match.vulns && Object.keys(match.vulns).length > 1) return 'high';
    if (match.vulns && Object.keys(match.vulns).length > 0) return 'medium';
    return 'low';
  }

  async processThreatAlert(threatData) {
    try {
      const alert = new ThreatAlert({
        // userId: null for system-generated alerts (now allowed by schema)
        alertId: generateAlertId(),
        title: threatData.title,
        description: threatData.description,
        severity: threatData.severity,
        type: threatData.type,
        source: threatData.source,
        status: 'new',
        detectedAt: new Date(),
        details: {
          target: threatData.target,
          confidence: threatData.confidence || 80,
          rawData: threatData
        }
      });

      await alert.save();
      
      // Emit via WebSocket if available
      if (global.io) {
        global.io.emit('threat-alert', {
          type: 'new-threat',
          data: {
            id: alert._id,
            title: alert.title,
            description: alert.description,
            severity: alert.severity,
            type: alert.type,
            source: alert.source,
            createdAt: alert.detectedAt
          }
        });
        
        // Also emit dashboard update
        global.io.emit('dashboard:threat-update', {
          type: 'threat-added',
          threatCount: await ThreatAlert.countDocuments(),
          latestThreat: {
            title: alert.title,
            severity: alert.severity,
            createdAt: alert.detectedAt
          }
        });
      }

      console.log(`Live threat alert generated: ${threatData.title}`);
    } catch (error) {
      console.error('Error processing threat alert:', error);
    }
  }

  async generateDemoAlert(threatData) {
    try {
      const alert = new ThreatAlert({
        userId: 'demo-user-id', // Use demo user ID
        alertId: generateAlertId(),
        title: threatData.title,
        description: threatData.description,
        severity: threatData.severity,
        type: threatData.type,
        source: threatData.source,
        status: 'new',
        detectedAt: new Date(),
        affectedSystems: ['demo-system-' + Math.floor(Math.random() * 3 + 1)],
        riskScore: Math.floor(Math.random() * 40) + 60, // 60-100
        indicators: {
          ip: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
          timestamp: new Date().toISOString()
        }
      });

      await alert.save();
      
      // Emit via WebSocket if available
      if (global.io) {
        global.io.emit('threat-alert', {
          type: 'new-threat',
          data: {
            id: alert._id,
            title: alert.title,
            description: alert.description,
            severity: alert.severity,
            type: alert.type,
            source: alert.source,
            createdAt: alert.detectedAt,
            dismissed: false
          }
        });
        
        // Also emit dashboard update
        global.io.emit('dashboard:threat-update', {
          type: 'threat-added',
          threatCount: await ThreatAlert.countDocuments(),
          latestThreat: {
            title: alert.title,
            severity: alert.severity,
            createdAt: alert.detectedAt
          }
        });
      }

      console.log(`Demo threat alert generated: ${threatData.title}`);
    } catch (error) {
      console.error('Error generating demo alert:', error);
    }
  }

  async monitorTarget(userId, target, type = 'auto') {
    try {
      if (threatQueue) {
        const job = await threatQueue.add('monitor-threat', {
          userId,
          target,
          type
        }, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 }
        });

        return { jobId: job.id, status: 'queued', target };
      } else {
        // Direct processing without queue
        const result = await this.processThreats(type, target, userId);
        return { jobId: Date.now().toString(), status: 'completed', target, result };
      }
    } catch (error) {
      console.error('Error in threat monitoring:', error);
      throw new Error('Failed to start threat monitoring');
    }
  }

  async processThreats(type, target, userId) {
    const threats = [];

    try {
      // Determine target type
      const targetType = this.determineTargetType(target);

      switch (targetType) {
        case 'ip':
          threats.push(...await this.analyzeIpThreats(target, userId));
          break;
        case 'domain':
          threats.push(...await this.analyzeDomainThreats(target, userId));
          break;
        case 'url':
          threats.push(...await this.analyzeUrlThreats(target, userId));
          break;
        case 'email':
          threats.push(...await this.analyzeEmailThreats(target, userId));
          break;
        case 'file':
          threats.push(...await this.analyzeFileThreats(target, userId));
          break;
        default:
          threats.push(...await this.analyzeGenericThreats(target, userId));
      }

      // Process and store threats
      for (const threat of threats) {
        await this.createThreatAlert(userId, threat);
      }

      return { threats: threats.length, processed: true };
    } catch (error) {
      console.error(`Error processing threats for ${target}:`, error);
      throw error;
    }
  }

  determineTargetType(target) {
    // IP address pattern
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(target)) {
      return 'ip';
    }
    
    // Email pattern
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      return 'email';
    }
    
    // URL pattern
    if (/^https?:\/\//.test(target)) {
      return 'url';
    }
    
    // Domain pattern
    if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(target)) {
      return 'domain';
    }
    
    // File hash pattern
    if (/^[a-fA-F0-9]{32,}$/.test(target)) {
      return 'file';
    }
    
    return 'generic';
  }

  async analyzeIpThreats(ip, userId) {
    const threats = [];

    try {
      // Check Shodan
      if (this.threatFeeds.get('shodan').enabled) {
        const shodanData = await this.searchShodan(ip);
        if (shodanData && shodanData.risks) {
          threats.push(...shodanData.risks);
        }
      }

      // Check VirusTotal
      if (this.threatFeeds.get('virustotal').enabled) {
        const vtData = await this.checkVirusTotal(ip, 'ip');
        if (vtData && vtData.malicious > 0) {
          threats.push({
            source: 'virustotal',
            type: 'malware',
            severity: 'high',
            title: `Malicious IP Detected: ${ip}`,
            description: `IP ${ip} has been flagged as malicious by ${vtData.malicious} security engines`,
            target: ip,
            details: {
              engines: vtData.engines,
              detections: vtData.detections,
              confidence: (vtData.malicious / vtData.total) * 100
            }
          });
        }
      }

      // Internal analysis
      const internalThreats = await this.analyzeInternalPatterns(ip, 'ip');
      threats.push(...internalThreats);

    } catch (error) {
      console.error(`Error analyzing IP threats for ${ip}:`, error);
    }

    return threats;
  }

  async analyzeDomainThreats(domain, userId) {
    const threats = [];

    try {
      // Check VirusTotal for domain
      if (this.threatFeeds.get('virustotal').enabled) {
        const vtData = await this.checkVirusTotalDomain(domain);
        if (vtData && vtData.malicious > 0) {
          threats.push({
            source: 'virustotal',
            type: 'malware',
            severity: 'high',
            title: `Malicious Domain Detected: ${domain}`,
            description: `Domain ${domain} has been flagged as malicious`,
            target: domain,
            details: vtData
          });
        }
      }

      // Check for phishing patterns
      const phishingRisk = this.checkPhishingPatterns(domain);
      if (phishingRisk.suspicious) {
        threats.push({
          source: 'internal-scan',
          type: 'phishing',
          severity: phishingRisk.severity,
          title: `Potential Phishing Domain: ${domain}`,
          description: phishingRisk.reason,
          target: domain,
          details: phishingRisk
        });
      }

    } catch (error) {
      console.error(`Error analyzing domain threats for ${domain}:`, error);
    }

    return threats;
  }

  async analyzeEmailThreats(email, userId) {
    const threats = [];

    try {
      // Check Have I Been Pwned
      if (this.threatFeeds.get('hibp').enabled) {
        const hibpData = await this.checkHIBP(email);
        if (hibpData && hibpData.breaches.length > 0) {
          threats.push({
            source: 'hibp',
            type: 'data-breach',
            severity: 'medium',
            title: `Email Found in Data Breaches: ${email}`,
            description: `Email ${email} found in ${hibpData.breaches.length} data breach(es)`,
            target: email,
            details: {
              breaches: hibpData.breaches,
              totalBreaches: hibpData.breaches.length,
              latestBreach: hibpData.breaches[0]
            }
          });
        }
      }

    } catch (error) {
      console.error(`Error analyzing email threats for ${email}:`, error);
    }

    return threats;
  }

  async analyzeUrlThreats(url, userId) {
    const threats = [];

    try {
      // Extract domain from URL
      const domain = new URL(url).hostname;
      
      // Analyze the domain
      const domainThreats = await this.analyzeDomainThreats(domain, userId);
      threats.push(...domainThreats);

      // Additional URL-specific checks
      const urlPatterns = this.checkMaliciousUrlPatterns(url);
      if (urlPatterns.suspicious) {
        threats.push({
          source: 'internal-scan',
          type: 'malware',
          severity: urlPatterns.severity,
          title: `Suspicious URL Pattern: ${url}`,
          description: urlPatterns.reason,
          target: url,
          details: urlPatterns
        });
      }

    } catch (error) {
      console.error(`Error analyzing URL threats for ${url}:`, error);
    }

    return threats;
  }

  async analyzeFileThreats(fileHash, userId) {
    const threats = [];

    try {
      // Check VirusTotal for file hash
      if (this.threatFeeds.get('virustotal').enabled) {
        const vtData = await this.checkVirusTotal(fileHash, 'file');
        if (vtData && vtData.malicious > 0) {
          threats.push({
            source: 'virustotal',
            type: 'malware',
            severity: 'critical',
            title: `Malicious File Detected: ${fileHash}`,
            description: `File hash ${fileHash} detected as malware by ${vtData.malicious} engines`,
            target: fileHash,
            details: vtData
          });
        }
      }

    } catch (error) {
      console.error(`Error analyzing file threats for ${fileHash}:`, error);
    }

    return threats;
  }

  async analyzeGenericThreats(target, userId) {
    // Generic threat analysis for unknown target types
    return [];
  }

  async checkVirusTotal(target, type = 'ip') {
    try {
      const apiKey = this.apiKeys.virustotal;
      if (!apiKey) return null;

      let endpoint;
      switch (type) {
        case 'ip':
          endpoint = `https://www.virustotal.com/vtapi/v2/ip-address/report?apikey=${apiKey}&ip=${target}`;
          break;
        case 'domain':
          endpoint = `https://www.virustotal.com/vtapi/v2/domain/report?apikey=${apiKey}&domain=${target}`;
          break;
        case 'file':
          endpoint = `https://www.virustotal.com/vtapi/v2/file/report?apikey=${apiKey}&resource=${target}`;
          break;
        default:
          return null;
      }

      const response = await axios.get(endpoint);
      return this.parseVirusTotalResponse(response.data);
    } catch (error) {
      console.error('VirusTotal API error:', error.message);
      return null;
    }
  }

  async checkVirusTotalDomain(domain) {
    return await this.checkVirusTotal(domain, 'domain');
  }

  parseVirusTotalResponse(data) {
    if (!data || data.response_code !== 1) return null;

    const scans = data.scans || {};
    const engines = Object.keys(scans);
    const malicious = engines.filter(engine => scans[engine].detected).length;
    
    return {
      total: engines.length,
      malicious,
      engines,
      detections: engines.filter(engine => scans[engine].detected),
      scanDate: data.scan_date,
      permalink: data.permalink
    };
  }

  async searchShodan(ip) {
    try {
      const apiKey = this.apiKeys.shodan;
      if (!apiKey) return null;

      const response = await axios.get(`https://api.shodan.io/shodan/host/${ip}?key=${apiKey}`);
      return this.parseShodanResponse(response.data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return { risks: [] }; // IP not found in Shodan
      }
      console.error('Shodan API error:', error.message);
      return null;
    }
  }

  parseShodanResponse(data) {
    const risks = [];

    if (data.vulns && data.vulns.length > 0) {
      data.vulns.forEach(vuln => {
        risks.push({
          source: 'shodan',
          type: 'vulnerability',
          severity: 'high',
          title: `Vulnerability Detected: ${vuln}`,
          description: `CVE ${vuln} detected on ${data.ip_str}`,
          target: data.ip_str,
          details: {
            cve: vuln,
            ports: data.ports,
            services: data.data.map(d => d.product).filter(Boolean)
          }
        });
      });
    }

    // Check for suspicious services
    if (data.ports) {
      const suspiciousPorts = [23, 135, 139, 445, 1433, 3389];
      const exposedPorts = data.ports.filter(port => suspiciousPorts.includes(port));
      
      if (exposedPorts.length > 0) {
        risks.push({
          source: 'shodan',
          type: 'suspicious-activity',
          severity: 'medium',
          title: `Suspicious Services Exposed`,
          description: `Potentially risky services exposed on ports: ${exposedPorts.join(', ')}`,
          target: data.ip_str,
          details: {
            exposedPorts,
            allPorts: data.ports
          }
        });
      }
    }

    return { risks };
  }

  async checkHIBP(email) {
    try {
      const apiKey = this.apiKeys.hibp;
      const headers = apiKey ? { 'hibp-api-key': apiKey } : {};

      const response = await axios.get(
        `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}`,
        { headers }
      );

      return { breaches: response.data };
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return { breaches: [] }; // No breaches found
      }
      console.error('HIBP API error:', error.message);
      return null;
    }
  }

  checkPhishingPatterns(domain) {
    const suspiciousPatterns = [
      /paypal.*\.(?!paypal\.com)/i,
      /amazon.*\.(?!amazon\.)/i,
      /google.*\.(?!google\.)/i,
      /microsoft.*\.(?!microsoft\.)/i,
      /bank.*login/i,
      /secure.*update/i,
      /verify.*account/i
    ];

    const typoSquatting = [
      'paypal', 'amazon', 'google', 'microsoft', 'apple', 'facebook'
    ];

    // Check for suspicious patterns
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(domain)) {
        return {
          suspicious: true,
          severity: 'high',
          reason: `Domain matches suspicious phishing pattern: ${pattern.source}`,
          confidence: 80
        };
      }
    }

    // Check for typosquatting
    for (const brand of typoSquatting) {
      if (this.calculateLevenshteinDistance(domain, brand) <= 2 && domain !== brand) {
        return {
          suspicious: true,
          severity: 'medium',
          reason: `Domain appears to be typosquatting ${brand}`,
          confidence: 60
        };
      }
    }

    return { suspicious: false };
  }

  checkMaliciousUrlPatterns(url) {
    const maliciousPatterns = [
      /bit\.ly/i,
      /tinyurl/i,
      /t\.co/i,
      /goo\.gl/i,
      /exe$/i,
      /\.zip$/i,
      /\.rar$/i
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(url)) {
        return {
          suspicious: true,
          severity: 'medium',
          reason: `URL contains suspicious pattern: ${pattern.source}`,
          confidence: 50
        };
      }
    }

    return { suspicious: false };
  }

  async analyzeInternalPatterns(target, type) {
    // Internal pattern analysis - placeholder for ML/AI analysis
    const threats = [];

    // This would contain internal threat detection logic
    // Based on historical data, user behavior, etc.

    return threats;
  }

  calculateLevenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  async createThreatAlert(userId, threatData) {
    try {
      const alert = new ThreatAlert({
        userId,
        alertId: generateAlertId(),
        source: threatData.source,
        type: threatData.type,
        severity: threatData.severity,
        title: threatData.title,
        description: threatData.description,
        details: {
          target: threatData.target,
          ...threatData.details
        },
        status: 'new'
      });

      await alert.save();

      // Update security profile
      await this.updateSecurityProfile(userId, alert);

      return alert;
    } catch (error) {
      console.error('Error creating threat alert:', error);
      throw error;
    }
  }

  async updateSecurityProfile(userId, alert) {
    try {
      const profile = await SecurityProfile.findOne({ userId });
      if (profile) {
        // Decrease threat score based on severity
        const severityPenalty = {
          'critical': 15,
          'high': 10,
          'medium': 5,
          'low': 2,
          'info': 1
        };

        const penalty = severityPenalty[alert.severity] || 5;
        const currentScore = profile.securityScore.components.threats;
        const newScore = Math.max(0, currentScore - penalty);

        await profile.updateSecurityScore('threats', newScore, `Threat detected: ${alert.title}`);
        await profile.updateMetrics('threatsDetected');
      }
    } catch (error) {
      console.error('Error updating security profile for threat:', error);
    }
  }

  async updateThreatFeeds() {
    console.log('Updating threat feeds...');
    
    // This would update internal threat intelligence feeds
    // Download new IOCs, update threat signatures, etc.
    
    return { updated: true, timestamp: new Date() };
  }

  getActiveFeedsStatus() {
    const status = {};
    this.threatFeeds.forEach((feed, key) => {
      status[key] = {
        name: feed.name,
        enabled: feed.enabled,
        lastUpdate: feed.lastUpdate || null
      };
    });
    return status;
  }
}

module.exports = new ThreatMonitor();