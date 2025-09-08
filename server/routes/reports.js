const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const VulnerabilityReport = require('../models/VulnerabilityReport');
const SecurityProfile = require('../models/SecurityProfile');
const ThreatAlert = require('../models/ThreatAlert');
const { generateScanId } = require('../utils/helpers');

// @route   GET /api/reports/dashboard
// @desc    Get dashboard summary report
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get latest security profile
    const securityProfile = await SecurityProfile.findOne({ userId }).sort({ updatedAt: -1 });
    
    // Get recent vulnerability reports (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentReports = await VulnerabilityReport.find({
      userId,
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: -1 }).limit(10);
    
    // Get recent threat alerts (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentThreats = await ThreatAlert.find({
      userId,
      createdAt: { $gte: sevenDaysAgo }
    }).sort({ createdAt: -1 }).limit(20);
    
    // Calculate dynamic trend data
    const threatTrend = calculateDynamicTrend(recentThreats, 'threat');
    const vulnerabilityTrend = calculateDynamicTrend(recentReports, 'vulnerability');
    
    // Calculate statistics
    const stats = {
      totalScans: await VulnerabilityReport.countDocuments({ userId }),
      totalThreats: await ThreatAlert.countDocuments({ userId }),
      totalVulnerabilities: recentReports.reduce((count, report) => {
        return count + (report.vulnerabilities?.length || 0);
      }, 0),
      criticalVulnerabilities: recentReports.reduce((count, report) => {
        return count + (report.vulnerabilities?.filter(v => v.severity === 'Critical' || v.severity === 'critical').length || 0);
      }, 0),
      highVulnerabilities: recentReports.reduce((count, report) => {
        return count + (report.vulnerabilities?.filter(v => v.severity === 'High' || v.severity === 'high').length || 0);
      }, 0),
      mediumVulnerabilities: recentReports.reduce((count, report) => {
        return count + (report.vulnerabilities?.filter(v => v.severity === 'Medium' || v.severity === 'medium').length || 0);
      }, 0),
      lowVulnerabilities: recentReports.reduce((count, report) => {
        return count + (report.vulnerabilities?.filter(v => v.severity === 'Low' || v.severity === 'low').length || 0);
      }, 0),
      securityScore: securityProfile?.securityScore?.overall || securityProfile?.securityScore || 0,
      lastScanDate: recentReports[0]?.createdAt || null,
      threatTrend: calculateThreatTrend(recentThreats)
    };
    
    res.json({
      success: true,
      data: {
        stats,
        recentReports: recentReports.slice(0, 5),
        recentThreats: recentThreats.slice(0, 10),
        securityProfile,
        threatTrend,
        vulnerabilityTrend
      }
    });
  } catch (error) {
    console.error('Dashboard report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate dashboard report',
      error: error.message
    });
  }
});

// @route   GET /api/reports/vulnerability/:reportId
// @desc    Get detailed vulnerability report
// @access  Private
router.get('/vulnerability/:reportId', auth, async (req, res) => {
  try {
    const report = await VulnerabilityReport.findOne({
      _id: req.params.reportId,
      userId: req.user.id
    });
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Vulnerability report not found'
      });
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Vulnerability report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve vulnerability report',
      error: error.message
    });
  }
});

// @route   GET /api/reports/export/:type
// @desc    Export reports in various formats
// @access  Private
router.get('/export/:type', auth, async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'json', dateFrom, dateTo } = req.query;
    
    let query = { userId: req.user.id };
    
    // Add date filtering if provided
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    
    let data = [];
    let filename = '';
    
    switch (type) {
      case 'vulnerabilities':
        data = await VulnerabilityReport.find(query).sort({ createdAt: -1 });
        filename = 'vulnerability-reports';
        break;
      case 'threats':
        data = await ThreatAlert.find(query).sort({ createdAt: -1 });
        filename = 'threat-alerts';
        break;
      case 'security-profile':
        data = await SecurityProfile.find(query).sort({ createdAt: -1 });
        filename = 'security-profiles';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type'
        });
    }
    
    if (format === 'csv') {
      const csvData = convertToCSV(data, type);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send(csvData);
    }
    
    res.json({
      success: true,
      data,
      exportInfo: {
        type,
        format,
        count: data.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export reports',
      error: error.message
    });
  }
});

// @route   POST /api/reports/demo-data
// @desc    Create demo vulnerability data for testing (development only)
// @access  Private
router.post('/demo-data', auth, async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        success: false,
        message: 'Demo data creation only available in development mode'
      });
    }

    const userId = req.user.id;
    
    // Create sample vulnerability reports
    const sampleReports = [
      {
        scanId: generateScanId(),
        userId,
        target: '192.168.1.1',
        scanType: 'full',
        status: 'completed',
        progress: 100,
        vulnerabilities: [
          {
            id: 'CVE-2023-0001',
            name: 'Remote Code Execution in SSH',
            severity: 'Critical',
            cvssScore: 9.8,
            description: 'Critical vulnerability allowing remote code execution',
            affectedService: 'SSH',
            port: 22,
            solution: 'Update SSH server to latest version'
          },
          {
            id: 'CVE-2023-0002',
            name: 'SQL Injection in Web Application',
            severity: 'High',
            cvssScore: 8.1,
            description: 'SQL injection vulnerability in login form',
            affectedService: 'HTTP',
            port: 80,
            solution: 'Implement parameterized queries'
          },
          {
            id: 'CVE-2023-0003',
            name: 'Weak SSL Configuration',
            severity: 'Medium',
            cvssScore: 5.3,
            description: 'SSL/TLS configuration allows weak ciphers',
            affectedService: 'HTTPS',
            port: 443,
            solution: 'Update SSL/TLS configuration'
          }
        ],
        summary: {
          totalVulnerabilities: 3,
          criticalCount: 1,
          highCount: 1,
          mediumCount: 1,
          lowCount: 0,
          riskScore: 85
        }
      },
      {
        scanId: generateScanId(),
        userId,
        target: '10.0.0.1',
        scanType: 'quick',
        status: 'completed',
        progress: 100,
        vulnerabilities: [
          {
            id: 'CVE-2023-0004',
            name: 'Information Disclosure',
            severity: 'Low',
            cvssScore: 3.7,
            description: 'Server banner reveals version information',
            affectedService: 'HTTP',
            port: 8080,
            solution: 'Configure server to hide version information'
          },
          {
            id: 'CVE-2023-0005',
            name: 'Directory Traversal',
            severity: 'High',
            cvssScore: 7.5,
            description: 'Path traversal vulnerability allows file access',
            affectedService: 'FTP',
            port: 21,
            solution: 'Update FTP server and implement proper access controls'
          }
        ],
        summary: {
          totalVulnerabilities: 2,
          criticalCount: 0,
          highCount: 1,
          mediumCount: 0,
          lowCount: 1,
          riskScore: 45
        }
      }
    ];

    // Create the reports
    for (const reportData of sampleReports) {
      const report = new VulnerabilityReport(reportData);
      await report.save();
    }

    // Update user's security profile
    const totalVulns = sampleReports.reduce((acc, report) => acc + report.summary.totalVulnerabilities, 0);
    const avgRiskScore = sampleReports.reduce((acc, report) => acc + report.summary.riskScore, 0) / sampleReports.length;

    await SecurityProfile.findOneAndUpdate(
      { userId },
      {
        $set: {
          securityScore: Math.max(0, 100 - avgRiskScore),
          lastAssessmentDate: new Date(),
          riskLevel: avgRiskScore > 70 ? 'high' : avgRiskScore > 40 ? 'medium' : 'low'
        }
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: `Created ${sampleReports.length} demo vulnerability reports with ${totalVulns} total vulnerabilities`,
      data: {
        reportsCreated: sampleReports.length,
        totalVulnerabilities: totalVulns,
        avgRiskScore
      }
    });

  } catch (error) {
    console.error('Demo data creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create demo data',
      error: error.message
    });
  }
});

// Helper function to calculate dynamic trend for charts (7-day data)
function calculateDynamicTrend(data, type) {
  const trend = Array(7).fill(0);
  const now = new Date();
  
  for (let i = 0; i < 7; i++) {
    const dayStart = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    
    if (type === 'threat') {
      trend[i] = data.filter(item => {
        const createdAt = new Date(item.createdAt);
        return createdAt >= dayStart && createdAt < dayEnd;
      }).length;
    } else if (type === 'vulnerability') {
      trend[i] = data.filter(item => {
        const createdAt = new Date(item.createdAt);
        return createdAt >= dayStart && createdAt < dayEnd;
      }).reduce((count, report) => {
        return count + (report.vulnerabilities?.length || 0);
      }, 0);
    }
  }
  
  return trend;
}

// Helper function to calculate threat trend
function calculateThreatTrend(threats) {
  if (threats.length < 2) return 0;
  
  const currentWeek = threats.filter(t => 
    new Date(t.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;
  
  const previousWeek = threats.filter(t => {
    const createdAt = new Date(t.createdAt);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    return createdAt >= twoWeeksAgo && createdAt < weekAgo;
  }).length;
  
  if (previousWeek === 0) return currentWeek > 0 ? 100 : 0;
  return Math.round(((currentWeek - previousWeek) / previousWeek) * 100);
}

// Helper function to convert data to CSV
function convertToCSV(data, type) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0].toObject()).join(',');
  const rows = data.map(item => {
    const values = Object.values(item.toObject()).map(value => {
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value).replace(/"/g, '""');
      }
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    return values.join(',');
  });
  
  return [headers, ...rows].join('\n');
}

module.exports = router;