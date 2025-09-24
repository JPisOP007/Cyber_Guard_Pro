const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const SecurityProfile = require('../models/SecurityProfile');
const { auth, authorize, requireEmailVerification } = require('../middleware/auth');
const { sanitizeInput, generateApiKey } = require('../utils/helpers');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Multer storage for avatars
const uploadDir = path.join(__dirname, '..', 'uploads', 'avatars');
// Ensure upload directory exists
try { fs.mkdirSync(uploadDir, { recursive: true }); } catch (_) {}
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${req.user.id}-${Date.now()}${ext || '.png'}`);
  },
});
const upload = multer({ storage });

// All routes require auth
router.use(auth);

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.toJSON()
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2-50 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2-50 characters'),
  
  body('profile.company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name must be less than 100 characters'),
  
  body('profile.jobTitle')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Job title must be less than 100 characters'),
  
  body('profile.phone')
    .optional()
    .trim()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  
  body('profile.timezone')
    .optional()
    .isIn([
      'UTC', 'US/Eastern', 'US/Central', 'US/Mountain', 'US/Pacific',
      'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo',
      'Asia/Shanghai', 'Australia/Sydney'
    ])
    .withMessage('Please provide a valid timezone')
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

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updateFields = {};
    const allowedFields = ['firstName', 'lastName'];
    
    // Update basic fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateFields[field] = sanitizeInput(req.body[field]);
      }
    });

    // Update profile fields
    if (req.body.profile) {
      const profileFields = ['company', 'jobTitle', 'phone', 'timezone'];
      updateFields.profile = { ...user.profile };
      
      profileFields.forEach(field => {
        if (req.body.profile[field] !== undefined) {
          updateFields.profile[field] = field === 'phone' ? 
            req.body.profile[field] : sanitizeInput(req.body.profile[field]);
        }
      });
    }

    // Update notification preferences
    if (req.body.profile && req.body.profile.notifications) {
      updateFields.profile.notifications = {
        ...user.profile.notifications,
        ...req.body.profile.notifications
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser.toJSON()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

// @route   PUT /api/users/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character')
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

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

    console.log(`Password changed for user: ${user.email}`);

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password'
    });
  }
});

// @route   GET /api/users/security-profile
// @desc    Get user security profile
// @access  Private
router.get('/security-profile', async (req, res) => {
  try {
    const securityProfile = await SecurityProfile.findOne({ userId: req.user.id });
    
    if (!securityProfile) {
      return res.status(404).json({
        success: false,
        message: 'Security profile not found'
      });
    }

    res.json({
      success: true,
      data: securityProfile
    });

  } catch (error) {
    console.error('Get security profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching security profile'
    });
  }
});

// @route   PUT /api/users/security-profile
// @desc    Update security profile settings
// @access  Private
router.put('/security-profile', [
  body('scanSettings.frequency')
    .optional()
    .isIn(['manual', 'daily', 'weekly', 'monthly'])
    .withMessage('Invalid scan frequency'),
  
  body('scanSettings.scanTypes')
    .optional()
    .isArray()
    .withMessage('Scan types must be an array'),
  
  body('scanSettings.notifications.threshold')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid notification threshold')
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

    const securityProfile = await SecurityProfile.findOne({ userId: req.user.id });
    if (!securityProfile) {
      return res.status(404).json({
        success: false,
        message: 'Security profile not found'
      });
    }

    // Update scan settings
    if (req.body.scanSettings) {
      securityProfile.scanSettings = {
        ...securityProfile.scanSettings,
        ...req.body.scanSettings
      };
    }

    // Update integrations
    if (req.body.integrations) {
      securityProfile.integrations = {
        ...securityProfile.integrations,
        ...req.body.integrations
      };
    }

    await securityProfile.save();

    res.json({
      success: true,
      message: 'Security profile updated successfully',
      data: securityProfile
    });

  } catch (error) {
    console.error('Update security profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating security profile'
    });
  }
});

// @route   POST /api/users/security-profile/assets
// @desc    Add asset to security profile
// @access  Private
router.post('/security-profile/assets', [
  body('type')
    .isIn(['domains', 'ipRanges', 'applications'])
    .withMessage('Invalid asset type'),
  
  body('data')
    .notEmpty()
    .withMessage('Asset data is required')
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

    const { type, data } = req.body;

    const securityProfile = await SecurityProfile.findOne({ userId: req.user.id });
    if (!securityProfile) {
      return res.status(404).json({
        success: false,
        message: 'Security profile not found'
      });
    }

    await securityProfile.addAsset(type, data);

    res.json({
      success: true,
      message: 'Asset added successfully',
      data: securityProfile.assets[type]
    });

  } catch (error) {
    console.error('Add asset error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while adding asset'
    });
  }
});

// @route   GET /api/users/api-key
// @desc    Get user API key
// @access  Private
router.get('/api-key', requireEmailVerification, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        apiKey: user.apiKey || 'Not generated',
        hasApiKey: !!user.apiKey
      }
    });

  } catch (error) {
    console.error('Get API key error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching API key'
    });
  }
});

// @route   POST /api/users/api-key/regenerate
// @desc    Regenerate user API key
// @access  Private
router.post('/api-key/regenerate', requireEmailVerification, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const newApiKey = user.generateApiKey();
    await user.save();

    res.json({
      success: true,
      message: 'API key regenerated successfully',
      data: {
        apiKey: newApiKey
      }
    });

    console.log(`API key regenerated for user: ${user.email}`);

  } catch (error) {
    console.error('Regenerate API key error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while regenerating API key'
    });
  }
});

// @route   DELETE /api/users/api-key
// @desc    Delete user API key
// @access  Private
router.delete('/api-key', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.apiKey = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'API key deleted successfully'
    });

  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting API key'
    });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', [
  body('password')
    .notEmpty()
    .withMessage('Password confirmation is required'),
  
  body('confirmation')
    .equals('DELETE')
    .withMessage('Type DELETE to confirm account deletion')
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

    const { password } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Delete related data
    await SecurityProfile.deleteOne({ userId: req.user.id });
    
    // TODO: Delete other related data (reports, alerts, etc.)

    // Delete user account
    await User.findByIdAndDelete(req.user.id);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

    console.log(`Account deleted: ${user.email}`);

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting account'
    });
  }
});

// Admin routes
// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, subscription } = req.query;

    const query = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (subscription) {
      query['subscription.plan'] = subscription;
    }

    const skip = (page - 1) * limit;
    
    const users = await User.find(query)
      .select('-password -emailVerificationToken -passwordResetToken')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// Get my profile
router.get('/me', async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password, __v, ...safe } = user;
    res.json(safe);
  } catch (e) { next(e); }
});

// Update my profile details
router.put('/me', async (req, res, next) => {
  try {
    const allowed = ['firstName','lastName','title','company','bio','phone','timezone'];
    const updates = {};
    for (const k of allowed) if (k in req.body) updates[`profile.${k}`] = req.body[k];
    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true }).lean();
    res.json({ ok: true, user });
  } catch (e) { next(e); }
});

// Update preferences
router.put('/preferences', async (req, res, next) => {
  try {
    const pref = req.body || {};
    const updates = {
      'preferences.theme': pref.theme,
      'preferences.notifications.email': !!pref?.notifications?.email,
      'preferences.notifications.push': !!pref?.notifications?.push,
      'preferences.newsletter': !!pref.newsletter,
    };
    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true }).lean();
    res.json({ ok: true, preferences: user.preferences });
  } catch (e) { next(e); }
});

// Change password
router.post('/change-password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Missing fields' });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const matches = user.comparePassword
      ? await user.comparePassword(currentPassword)
      : await bcrypt.compare(currentPassword, user.password);
    if (!matches) return res.status(400).json({ message: 'Current password incorrect' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Upload avatar
router.post('/avatar', upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file' });
    const relativePath = `/uploads/avatars/${req.file.filename}`;
    // Build absolute URL for cross-origin clients (e.g., CRA on :3000)
    const base = process.env.SERVER_PUBLIC_URL
      || `${req.protocol}://${req.get('host')}`;
    const absoluteUrl = `${base}${relativePath}`;
    // Save both: keep backward-compatible relative path in "avatar", absolute in "avatarUrl"
    await User.findByIdAndUpdate(req.user.id, {
      $set: { 'profile.avatar': relativePath, 'profile.avatarUrl': absoluteUrl }
    });
    res.json({ ok: true, avatarUrl: absoluteUrl, avatar: relativePath });
  } catch (e) { next(e); }
});

module.exports = router;