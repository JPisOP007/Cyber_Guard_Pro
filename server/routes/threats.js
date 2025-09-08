const express = require('express');
const { body, query, validationResult } = require('express-validator');
const ThreatAlert = require('../models/ThreatAlert');
const threatMonitor = require('../services/threatMonitor');
const { auth, requireSubscription, requireEmailVerification } = require('../middleware/auth');
const { getPagination, createPaginationMeta } = require('../utils/helpers');

const router = express.Router();

// All routes require authentication
router.use(auth);
router.use(requireEmailVerification);

// @route   POST /api/threats/monitor
// @desc    Start monitoring a target for threats
// @access  Private
router.post('/monitor', requireSubscription('pro', 'business', 'enterprise'), [
  body('target')
    .notEmpty()
    .withMessage('Target is required')
    .isLength({ max: 255 })
    .withMessage('Target must be less than 255 characters'),
  
  body('type')
    .optional()
    .isIn(['ip', 'domain', 'url', 'email', 'file', 'auto'])
    .withMessage('Invalid target type')
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

    const { target, type = 'auto' } = req.body;

    // Check subscription limits
    const userPlan = req.user.subscription?.plan || 'free';
    const monitorLimits = {
      pro: { maxTargets: 10 },
      business: { maxTargets: 100 },
      enterprise: { maxTargets: -1 }
    };

    const limits = monitorLimits[userPlan];
    
    // Check current monitoring targets
    if (limits.maxTargets !== -1) {
      const currentTargets = await ThreatAlert.distinct('details.target', { 
        userId: req.user.id,
        status: { $in: ['new', 'investigating', 'confirmed'] }
      });

      if (currentTargets.length >= limits.maxTargets) {
        return res.status(403).json({
          success: false,
          message: `Your plan allows monitoring of maximum ${limits.maxTargets} targets`,
          currentPlan: userPlan,
          currentTargets: currentTargets.length,
          limit: limits.maxTargets
        });
      }
    }

    // Start monitoring
    const result = await threatMonitor.monitorTarget(req.user.id, target, type);

    res.status(201).json({
      success: true,
      message: 'Threat monitoring started successfully',
      data: result
    });

    console.log(`Threat monitoring started for user ${req.user.email}: ${target}`);

  } catch (error) {
    console.error('Start threat monitoring error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while starting threat monitoring'
    });
  }
});

// @route   GET /api/threats
// @desc    Get user's threat alerts
// @access  Private
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1-50'),
  query('severity').optional().isIn(['info', 'low', 'medium', 'high', 'critical']).withMessage('Invalid severity'),
  query('status').optional().isIn(['new', 'investigating', 'confirmed', 'false-positive', 'resolved', 'ignored']).withMessage('Invalid status'),
  query('type').optional().isIn(['malware', 'phishing', 'data-breach', 'vulnerability', 'suspicious-activity', 'policy-violation', 'compliance-issue']).withMessage('Invalid type'),
  query('source').optional().isIn(['internal-scan', 'virustotal', 'shodan', 'hibp', 'threat-feed', 'user-report', 'ai-analysis']).withMessage('Invalid source')
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

    const { page = 1, limit = 20, severity, status, type, source, search } = req.query;
    const { skip, limit: limitNum } = getPagination(page, limit);

    const query = { userId: req.user.id, archived: false };
    
    if (severity) query.severity = severity;
    if (status) query.status = status;
    if (type) query.type = type;
    if (source) query.source = source;
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'details.target': { $regex: search, $options: 'i' } }
      ];
    }

    const alerts = await ThreatAlert.find(query)
      .select('alertId title description severity status type source firstSeen details.target priority')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await ThreatAlert.countDocuments(query);
    const paginationMeta = createPaginationMeta(total, parseInt(page), limitNum);

    res.json({
      success: true,
      data: {
        alerts,
        pagination: paginationMeta
      }
    });

  } catch (error) {
    console.error('Get threats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching threats'
    });
  }
});

// @route   GET /api/threats/:alertId
// @desc    Get threat alert details
// @access  Private
router.get('/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await ThreatAlert.findOne({ 
      alertId, 
      userId: req.user.id 
    }).populate('investigation.assigned', 'firstName lastName email');

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Threat alert not found'
      });
    }

    // Record view
    await alert.recordView();

    res.json({
      success: true,
      data: alert
    });

  } catch (error) {
    console.error('Get threat details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching threat details'
    });
  }
});

// @route   PUT /api/threats/:alertId/acknowledge
// @desc    Acknowledge a threat alert
// @access  Private
router.put('/:alertId/acknowledge', async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await ThreatAlert.findOne({ 
      alertId, 
      userId: req.user.id 
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Threat alert not found'
      });
    }

    if (alert.status !== 'new') {
      return res.status(400).json({
        success: false,
        message: 'Only new alerts can be acknowledged'
      });
    }

    alert.status = 'investigating';
    alert.investigation.assigned = req.user.id;
    alert.investigation.assignedAt = new Date();
    
    alert.actions.push({
      type: 'investigate',
      description: 'Alert acknowledged and investigation started',
      performedBy: req.user.id,
      performedAt: new Date(),
      result: {
        success: true,
        message: 'Alert acknowledged'
      }
    });

    await alert.save();

    res.json({
      success: true,
      message: 'Threat alert acknowledged successfully',
      data: {
        alertId: alert.alertId,
        status: alert.status
      }
    });

  } catch (error) {
    console.error('Acknowledge threat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while acknowledging threat'
    });
  }
});

// @route   PUT /api/threats/:alertId/resolve
// @desc    Resolve a threat alert
// @access  Private
router.put('/:alertId/resolve', [
  body('resolution')
    .notEmpty()
    .withMessage('Resolution description is required')
    .isLength({ max: 1000 })
    .withMessage('Resolution must be less than 1000 characters'),
  
  body('recommendations')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Recommendations must be less than 2000 characters')
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

    const { alertId } = req.params;
    const { resolution, recommendations } = req.body;

    const alert = await ThreatAlert.findOne({ 
      alertId, 
      userId: req.user.id 
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Threat alert not found'
      });
    }

    if (alert.status === 'resolved') {
      return res.status(400).json({
        success: false,
        message: 'Alert is already resolved'
      });
    }

    await alert.resolve(resolution, req.user.id);
    
    if (recommendations) {
      alert.investigation.recommendations = recommendations;
      await alert.save();
    }

    res.json({
      success: true,
      message: 'Threat alert resolved successfully',
      data: {
        alertId: alert.alertId,
        status: alert.status
      }
    });

    console.log(`Threat resolved by user ${req.user.email}: ${alertId}`);

  } catch (error) {
    console.error('Resolve threat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resolving threat'
    });
  }
});

// @route   PUT /api/threats/:alertId/escalate
// @desc    Escalate a threat alert
// @access  Private
router.put('/:alertId/escalate', [
  body('reason')
    .notEmpty()
    .withMessage('Escalation reason is required')
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters')
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

    const { alertId } = req.params;
    const { reason } = req.body;

    const alert = await ThreatAlert.findOne({ 
      alertId, 
      userId: req.user.id 
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Threat alert not found'
      });
    }

    if (alert.priority >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Alert is already at maximum priority'
      });
    }

    await alert.escalate(reason, req.user.id);

    res.json({
      success: true,
      message: 'Threat alert escalated successfully',
      data: {
        alertId: alert.alertId,
        priority: alert.priority
      }
    });

  } catch (error) {
    console.error('Escalate threat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while escalating threat'
    });
  }
});

// @route   PUT /api/threats/:alertId/false-positive
// @desc    Mark threat as false positive
// @access  Private
router.put('/:alertId/false-positive', [
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters')
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

    const { alertId } = req.params;
    const { reason } = req.body;

    const alert = await ThreatAlert.findOne({ 
      alertId, 
      userId: req.user.id 
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Threat alert not found'
      });
    }

    alert.status = 'false-positive';
    alert.investigation.findings = reason;
    
    alert.actions.push({
      type: 'investigate',
      description: 'Marked as false positive',
      performedBy: req.user.id,
      performedAt: new Date(),
      result: {
        success: true,
        message: 'Marked as false positive',
        data: { reason }
      }
    });

    await alert.save();

    res.json({
      success: true,
      message: 'Threat alert marked as false positive',
      data: {
        alertId: alert.alertId,
        status: alert.status
      }
    });

  } catch (error) {
    console.error('Mark false positive error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking as false positive'
    });
  }
});

// @route   POST /api/threats/:alertId/actions
// @desc    Add action to threat alert
// @access  Private
router.post('/:alertId/actions', [
  body('type')
    .isIn(['block-ip', 'quarantine-file', 'notify-admin', 'escalate', 'investigate', 'whitelist', 'create-rule'])
    .withMessage('Invalid action type'),
  
  body('description')
    .notEmpty()
    .withMessage('Action description is required')
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
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

    const { alertId } = req.params;
    const { type, description } = req.body;

    const alert = await ThreatAlert.findOne({ 
      alertId, 
      userId: req.user.id 
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Threat alert not found'
      });
    }

    alert.actions.push({
      type,
      description,
      performedBy: req.user.id,
      performedAt: new Date(),
      automated: false,
      result: {
        success: true,
        message: 'Action recorded'
      }
    });

    await alert.save();

    res.json({
      success: true,
      message: 'Action added successfully',
      data: alert.actions[alert.actions.length - 1]
    });

  } catch (error) {
    console.error('Add action error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding action'
    });
  }
});

// @route   GET /api/threats/statistics
// @desc    Get threat statistics
// @access  Private
router.get('/stats/summary', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;

    let dateFilter = {};
    if (timeRange !== 'all') {
      const days = parseInt(timeRange.replace('d', ''));
      dateFilter = {
        createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
      };
    }

    const stats = await ThreatAlert.aggregate([
      { 
        $match: { 
          userId: req.user.id,
          archived: false,
          ...dateFilter
        }
      },
      {
        $group: {
          _id: null,
          totalThreats: { $sum: 1 },
          newThreats: {
            $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] }
          },
          investigatingThreats: {
            $sum: { $cond: [{ $eq: ['$status', 'investigating'] }, 1, 0] }
          },
          resolvedThreats: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          criticalThreats: {
            $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
          },
          highThreats: {
            $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] }
          },
          mediumThreats: {
            $sum: { $cond: [{ $eq: ['$severity', 'medium'] }, 1, 0] }
          },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'resolved'] },
                { $subtract: ['$updatedAt', '$createdAt'] },
                null
              ]
            }
          }
        }
      }
    ]);

    // Get threat types breakdown
    const typeStats = await ThreatAlert.aggregate([
      { 
        $match: { 
          userId: req.user.id,
          archived: false,
          ...dateFilter
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const result = stats[0] || {
      totalThreats: 0,
      newThreats: 0,
      investigatingThreats: 0,
      resolvedThreats: 0,
      criticalThreats: 0,
      highThreats: 0,
      mediumThreats: 0,
      avgResolutionTime: 0
    };

    result.threatTypes = typeStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // Convert resolution time to hours
    if (result.avgResolutionTime) {
      result.avgResolutionTimeHours = Math.round(result.avgResolutionTime / (1000 * 60 * 60));
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get threat statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching threat statistics'
    });
  }
});

// @route   GET /api/threats/feeds/status
// @desc    Get threat feed status
// @access  Private
router.get('/feeds/status', requireSubscription('pro', 'business', 'enterprise'), async (req, res) => {
  try {
    const feedStatus = threatMonitor.getActiveFeedsStatus();

    res.json({
      success: true,
      data: {
        feeds: feedStatus,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Get feed status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching feed status'
    });
  }
});

// @route   DELETE /api/threats/:alertId
// @desc    Archive a threat alert
// @access  Private
router.delete('/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await ThreatAlert.findOne({ 
      alertId, 
      userId: req.user.id 
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Threat alert not found'
      });
    }

    alert.archived = true;
    alert.archivedAt = new Date();
    alert.archivedBy = req.user.id;
    await alert.save();

    res.json({
      success: true,
      message: 'Threat alert archived successfully'
    });

  } catch (error) {
    console.error('Archive threat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while archiving threat'
    });
  }
});

module.exports = router;