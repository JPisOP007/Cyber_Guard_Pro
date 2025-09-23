const express = require('express');
const { body, query, validationResult } = require('express-validator');
const VulnerabilityReport = require('../models/VulnerabilityReport');
const vulnerabilityScanner = require('../services/vulnerabilityScanner');
const { auth, requireSubscription } = require('../middleware/auth');
const { isValidIP, isValidDomain, isValidURL, getPagination, createPaginationMeta } = require('../utils/helpers');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   POST /api/scans
// @desc    Start a new vulnerability scan
// @access  Private
router.post('/', [
  body('targets')
    .isArray({ min: 1 })
    .withMessage('At least one target is required')
    .custom((targets) => {
      for (const target of targets) {
        // Accept IP, domain, or full URL. If URL, extract hostname and validate.
        let value = target;
        if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
          try {
            const urlObj = new URL(value);
            value = urlObj.hostname;
          } catch (e) {
            throw new Error(`Invalid URL target: ${target}`);
          }
        }
        if (!isValidIP(value) && !isValidDomain(value)) {
          throw new Error(`Invalid target format: ${target}`);
        }
      }
      return true;
    }),
  
  body('scanType')
    .optional()
    .isIn(['full', 'quick', 'targeted', 'compliance', 'retest'])
    .withMessage('Invalid scan type'),
  
  body('config.scanTypes')
    .optional()
    .isArray()
    .withMessage('Scan types must be an array')
    .custom((scanTypes) => {
      const validTypes = ['port', 'vulnerability', 'ssl', 'dns', 'web', 'malware'];
      for (const type of scanTypes) {
        if (!validTypes.includes(type)) {
          throw new Error(`Invalid scan type: ${type}`);
        }
      }
      return true;
    }),
  
  body('config.intensity')
    .optional()
    .isIn(['light', 'normal', 'aggressive'])
    .withMessage('Invalid scan intensity')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { targets, scanType, config } = req.body;

    // Normalize targets: if a target is a URL, use its hostname; lower-case for consistency
    const normalizedTargets = targets.map((t) => {
      if (typeof t === 'string' && /^https?:\/\//i.test(t)) {
        try {
          const u = new URL(t);
          return u.hostname.toLowerCase();
        } catch (e) {
          // This should be caught by validation, but fallback to original
          return t;
        }
      }
      return typeof t === 'string' ? t.toLowerCase() : t;
    });

    // Check subscription limits
    const userPlan = req.user.subscription?.plan || 'free';
    const scanLimits = {
  free: { maxTargets: 3, maxConcurrent: 3, scanTypes: ['port', 'vulnerability', 'web'] },
  pro: { maxTargets: 25, maxConcurrent: 10, scanTypes: ['port', 'vulnerability', 'ssl', 'dns', 'web'] },
  business: { maxTargets: 100, maxConcurrent: 25, scanTypes: ['port', 'vulnerability', 'ssl', 'dns', 'web'] },
  enterprise: { maxTargets: -1, maxConcurrent: -1, scanTypes: ['port', 'vulnerability', 'ssl', 'dns', 'web', 'malware'] }
    };

    const limits = scanLimits[userPlan];

    // Check target limits
    if (limits.maxTargets !== -1 && targets.length > limits.maxTargets) {
      return res.status(403).json({
        success: false,
        message: `Your plan allows maximum ${limits.maxTargets} targets per scan. Upgrade to scan more targets.`,
        currentPlan: userPlan,
        limit: limits.maxTargets
      });
    }

    // Check concurrent scan limits
    const activeScans = vulnerabilityScanner.getActiveScanCount();
    if (limits.maxConcurrent !== -1 && activeScans >= limits.maxConcurrent) {
      return res.status(403).json({
        success: false,
        message: `Your plan allows maximum ${limits.maxConcurrent} concurrent scans. Please wait for current scans to complete.`,
        currentPlan: userPlan,
        activeScanCount: activeScans,
        limit: limits.maxConcurrent
      });
    }

    // Filter scan types based on subscription
    const requestedScanTypes = config?.scanTypes || ['port', 'vulnerability'];
    const allowedScanTypes = requestedScanTypes.filter(type => limits.scanTypes.includes(type));
    
    if (allowedScanTypes.length !== requestedScanTypes.length) {
      const unauthorizedTypes = requestedScanTypes.filter(type => !limits.scanTypes.includes(type));
      return res.status(403).json({
        success: false,
        message: `Your plan doesn't include these scan types: ${unauthorizedTypes.join(', ')}`,
        currentPlan: userPlan,
        allowedScanTypes: limits.scanTypes
      });
    }

    const scanConfig = {
      ...config,
      scanType: scanType || 'full',
      scanTypes: allowedScanTypes,
      intensity: config?.intensity || 'normal',
      timeout: config?.timeout || 300000,
      maxConcurrency: Math.min(config?.maxConcurrency || 10, 20)
    };

    // Start the scan
  const result = await vulnerabilityScanner.startScan(req.user.id, normalizedTargets, scanConfig);

    res.status(201).json({
      success: true,
      message: 'Vulnerability scan started successfully',
      data: result
    });

    console.log(`Scan started for user ${req.user.email}: ${result.scanId}`);

  } catch (error) {
    console.error('Start scan error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while starting scan'
    });
  }
});

// @route   GET /api/scans
// @desc    Get user's vulnerability scans
// @access  Private
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1-50'),
  query('status').optional().isIn(['pending', 'running', 'completed', 'failed', 'cancelled']).withMessage('Invalid status'),
  query('scanType').optional().isIn(['full', 'quick', 'targeted', 'compliance', 'retest']).withMessage('Invalid scan type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { page = 1, limit = 10, status, scanType, search } = req.query;
    const { skip, limit: limitNum } = getPagination(page, limit);

    const query = { userId: req.user.id };
    
    if (status) {
      query.status = status;
    }
    
    if (scanType) {
      query.scanType = scanType;
    }
    
    if (search) {
      query.$or = [
        { scanId: { $regex: search, $options: 'i' } },
        { targets: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const scans = await VulnerabilityReport.find(query)
      .select('scanId scanType targets status progress startTime endTime duration summary')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await VulnerabilityReport.countDocuments(query);
    const paginationMeta = createPaginationMeta(total, parseInt(page), limitNum);

    res.json({
      success: true,
      data: {
        scans,
        pagination: paginationMeta
      }
    });

  } catch (error) {
    console.error('Get scans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching scans'
    });
  }
});

// @route   GET /api/scans/:scanId
// @desc    Get scan details
// @access  Private
router.get('/:scanId', async (req, res) => {
  try {
    const { scanId } = req.params;

    const scan = await VulnerabilityReport.findOne({ 
      scanId, 
      userId: req.user.id 
    });

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan not found'
      });
    }

    res.json({
      success: true,
      data: scan
    });

  } catch (error) {
    console.error('Get scan details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching scan details'
    });
  }
});

// @route   GET /api/scans/:scanId/status
// @desc    Get scan status
// @access  Private
router.get('/:scanId/status', async (req, res) => {
  try {
    const { scanId } = req.params;

    // First verify ownership
    const scan = await VulnerabilityReport.findOne({ 
      scanId, 
      userId: req.user.id 
    });

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan not found'
      });
    }

    // Get real-time status from scanner
    const status = await vulnerabilityScanner.getScanStatus(scanId);

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Get scan status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching scan status'
    });
  }
});

// @route   POST /api/scans/:scanId/cancel
// @desc    Cancel a running scan
// @access  Private
router.post('/:scanId/cancel', async (req, res) => {
  try {
    const { scanId } = req.params;

    // Verify ownership
    const scan = await VulnerabilityReport.findOne({ 
      scanId, 
      userId: req.user.id 
    });

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan not found'
      });
    }

    if (!['pending', 'running'].includes(scan.status)) {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel pending or running scans'
      });
    }

    const result = await vulnerabilityScanner.cancelScan(scanId);

    res.json({
      success: true,
      message: 'Scan cancelled successfully',
      data: result
    });

    console.log(`Scan cancelled by user ${req.user.email}: ${scanId}`);

  } catch (error) {
    console.error('Cancel scan error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while cancelling scan'
    });
  }
});

// @route   GET /api/scans/:scanId/vulnerabilities
// @desc    Get scan vulnerabilities
// @access  Private
router.get('/:scanId/vulnerabilities', [
  query('severity').optional().isIn(['info', 'low', 'medium', 'high', 'critical']).withMessage('Invalid severity'),
  query('category').optional().isIn(['network', 'web', 'system', 'database', 'application', 'configuration']).withMessage('Invalid category'),
  query('status').optional().isIn(['open', 'confirmed', 'false-positive', 'resolved', 'wont-fix', 'duplicate']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { scanId } = req.params;
    const { severity, category, status } = req.query;

    const scan = await VulnerabilityReport.findOne({ 
      scanId, 
      userId: req.user.id 
    });

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan not found'
      });
    }

    let vulnerabilities = scan.vulnerabilities;

    // Apply filters
    if (severity) {
      vulnerabilities = vulnerabilities.filter(v => v.severity === severity);
    }

    if (category) {
      vulnerabilities = vulnerabilities.filter(v => v.category === category);
    }

    if (status) {
      vulnerabilities = vulnerabilities.filter(v => v.status === status);
    }

    res.json({
      success: true,
      data: {
        scanId,
        totalVulnerabilities: scan.vulnerabilities.length,
        filteredCount: vulnerabilities.length,
        vulnerabilities,
        summary: scan.summary
      }
    });

  } catch (error) {
    console.error('Get vulnerabilities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching vulnerabilities'
    });
  }
});

// @route   PUT /api/scans/:scanId/vulnerabilities/:vulnId
// @desc    Update vulnerability status
// @access  Private
router.put('/:scanId/vulnerabilities/:vulnId', [
  body('status')
    .isIn(['open', 'confirmed', 'false-positive', 'resolved', 'wont-fix', 'duplicate'])
    .withMessage('Invalid vulnerability status'),
  
  body('resolutionNotes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Resolution notes must be less than 1000 characters'),
  
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID for assignment')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { scanId, vulnId } = req.params;
    const { status, resolutionNotes, assignedTo } = req.body;

    const scan = await VulnerabilityReport.findOne({ 
      scanId, 
      userId: req.user.id 
    });

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan not found'
      });
    }

    const vulnerability = scan.vulnerabilities.id(vulnId);
    if (!vulnerability) {
      return res.status(404).json({
        success: false,
        message: 'Vulnerability not found'
      });
    }

    // Update vulnerability
    vulnerability.status = status;
    
    if (resolutionNotes) {
      vulnerability.resolutionNotes = resolutionNotes;
    }
    
    if (assignedTo) {
      vulnerability.assignedTo = assignedTo;
    }

    if (status === 'resolved') {
      vulnerability.resolvedDate = new Date();
    }

    await scan.save();

    res.json({
      success: true,
      message: 'Vulnerability updated successfully',
      data: vulnerability
    });

  } catch (error) {
    console.error('Update vulnerability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating vulnerability'
    });
  }
});

// @route   GET /api/scans/:scanId/export
// @desc    Export scan report (csv|json|pdf)
// @access  Private
router.get('/:scanId/export', requireSubscription('pro', 'business', 'enterprise'), async (req, res) => {
  try {
    const format = (req.query.format || 'json').toString().toLowerCase();
    if (!['csv', 'json', 'pdf'].includes(format)) {
      return res.status(400).json({ success: false, message: 'Invalid export format' });
    }

    const { scanId } = req.params;
    const includeResolved = req.query.includeResolved !== 'false';

    const scan = await VulnerabilityReport.findOne({ scanId, userId: req.user.id });
    if (!scan) {
      return res.status(404).json({ success: false, message: 'Scan not found' });
    }

    const vulns = (scan.vulnerabilities || []).filter(v => includeResolved || v.status !== 'resolved');

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="scan-${scanId}.json"`);
      return res.send(JSON.stringify({
        scanId: scan.scanId,
        targets: scan.targets,
        summary: scan.summary,
        vulnerabilities: vulns
      }, null, 2));
    }

    if (format === 'csv') {
      const headers = [
        'id','title','severity','category','target','port','service','verified','confidence','method','evidenceLevel','cvssScore','cwe','status'
      ];
      const escape = (v) => {
        if (v == null) return '';
        const s = String(v).replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
      };
      const rows = vulns.map(v => [
        v.id || '', v.title || v.name || '', v.severity || '', v.category || '', v.target || '', v.port || '', v.service || '',
        typeof v.verified === 'boolean' ? v.verified : '', typeof v.confidence === 'number' ? v.confidence : '', v.method || '', v.evidenceLevel || '',
        v.cvssScore != null ? v.cvssScore : '', v.cwe || '', v.status || ''
      ].map(escape).join(','));
      const csv = [headers.join(','), ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="scan-${scanId}.csv"`);
      return res.send(csv);
    }

    if (format === 'pdf') {
      const PDFDocument = require('pdfkit');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="scan-${scanId}.pdf"`);
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      doc.pipe(res);
      doc.fontSize(18).text('Cyber Guard Pro - Scan Report', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Scan ID: ${scan.scanId}`);
      doc.text(`Targets: ${scan.targets.join(', ')}`);
      doc.text(`Total Vulnerabilities: ${scan.summary?.totalVulnerabilities || 0}`);
      doc.moveDown();
      vulns.forEach((v, i) => {
        doc.fontSize(14).text(`${i + 1}. ${v.title || v.name || 'Untitled'}`, { continued: false });
        doc.fontSize(10).text(`Severity: ${v.severity} | Category: ${v.category} | Target: ${v.target}`);
        if (v.port) doc.text(`Port: ${v.port} ${v.service ? `(${v.service})` : ''}`);
        if (v.description) doc.text(v.description);
        if (v.solution) doc.text(`Solution: ${v.solution}`);
        doc.moveDown();
      });
      doc.end();
    }
  } catch (error) {
    console.error('Export scan error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Server error while exporting scan' });
    }
  }
});

// @route   DELETE /api/scans/:scanId
// @desc    Delete a scan report
// @access  Private
router.delete('/:scanId', async (req, res) => {
  try {
    const { scanId } = req.params;

    const scan = await VulnerabilityReport.findOne({ 
      scanId, 
      userId: req.user.id 
    });

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan not found'
      });
    }

    // Don't allow deletion of running scans
    if (['pending', 'running'].includes(scan.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete running scans. Cancel the scan first.'
      });
    }

    await VulnerabilityReport.findByIdAndDelete(scan._id);

    res.json({
      success: true,
      message: 'Scan deleted successfully'
    });

    console.log(`Scan deleted by user ${req.user.email}: ${scanId}`);

  } catch (error) {
    console.error('Delete scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting scan'
    });
  }
});

// @route   GET /api/scans/statistics
// @desc    Get user scan statistics
// @access  Private
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await VulnerabilityReport.aggregate([
      { $match: { userId: req.user.id } },
      {
        $group: {
          _id: null,
          totalScans: { $sum: 1 },
          completedScans: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          runningScans: {
            $sum: { $cond: [{ $in: ['$status', ['pending', 'running']] }, 1, 0] }
          },
          totalVulnerabilities: { $sum: '$summary.totalVulnerabilities' },
          criticalVulns: { $sum: '$summary.severityCounts.critical' },
          highVulns: { $sum: '$summary.severityCounts.high' },
          mediumVulns: { $sum: '$summary.severityCounts.medium' },
          lowVulns: { $sum: '$summary.severityCounts.low' }
        }
      }
    ]);

    const result = stats[0] || {
      totalScans: 0,
      completedScans: 0,
      runningScans: 0,
      totalVulnerabilities: 0,
      criticalVulns: 0,
      highVulns: 0,
      mediumVulns: 0,
      lowVulns: 0
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get scan statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching scan statistics'
    });
  }
});

module.exports = router;