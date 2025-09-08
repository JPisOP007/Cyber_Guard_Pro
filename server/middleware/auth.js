const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware
 * Verifies JWT token and adds user info to request
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = authHeader;
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Handle demo user
      if (decoded.id === 'demo-user-id') {
        req.user = { 
          id: 'demo-user-id', 
          email: 'demo@cyberguard.com',
          role: 'user',
          subscription: { plan: 'pro' }, // Give demo user pro features
          isEmailVerified: true // Demo user is always verified
        };
        return next();
      }

      // Get user from database
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is valid but user no longer exists'
        });
      }

      // Check if account is locked
      if (user.isLocked) {
        return res.status(423).json({
          success: false,
          message: 'Account is temporarily locked'
        });
      }

      // Add user info to request
      req.user = {
        id: user._id,
        email: user.email,
        role: user.role,
        subscription: user.subscription,
        isEmailVerified: user.isEmailVerified
      };

      next();
    } catch (tokenError) {
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
      } else if (tokenError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      } else {
        throw tokenError;
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {Array} roles - Array of allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient privileges'
      });
    }

    next();
  };
};

/**
 * Subscription-based authorization middleware
 * @param {Array} plans - Array of allowed subscription plans
 */
const requireSubscription = (...plans) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required'
      });
    }

    const userPlan = req.user.subscription?.plan || 'free';
    
    if (!plans.includes(userPlan)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Subscription upgrade required',
        requiredPlans: plans,
        currentPlan: userPlan
      });
    }

    next();
  };
};

/**
 * Email verification requirement middleware
 */
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication required'
    });
  }

  // Skip email verification for demo users
  if (req.user.id === 'demo-user-id') {
    return next();
  }

  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }

  next();
};

/**
 * API key authentication middleware
 * Alternative authentication method for API access
 */
const apiKeyAuth = async (req, res, next) => {
  try {
    // Check for API key in header
    const apiKey = req.header('X-API-Key') || req.header('x-api-key');
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key required'
      });
    }

    // Find user by API key
    const user = await User.findOne({ apiKey });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked'
      });
    }

    // Add user info to request
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      subscription: user.subscription,
      isEmailVerified: user.isEmailVerified
    };

    // Track API usage
    req.authMethod = 'api-key';

    next();
  } catch (error) {
    console.error('API key auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during API authentication'
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user info if authenticated but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // If no token, continue without authentication
    if (!token) {
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.id);
      if (user && !user.isLocked) {
        req.user = {
          id: user._id,
          email: user.email,
          role: user.role,
          subscription: user.subscription,
          isEmailVerified: user.isEmailVerified
        };
      }
    } catch (tokenError) {
      // Ignore token errors for optional auth
      console.log('Optional auth token error:', tokenError.message);
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    // Continue without authentication on server error
    next();
  }
};

/**
 * Rate limiting based on user tier
 */
const userTierRateLimit = (req, res, next) => {
  // This would be implemented with a rate limiting library
  // Different limits based on subscription plan
  const plan = req.user?.subscription?.plan || 'free';
  
  const limits = {
    free: 100,      // 100 requests per hour
    pro: 1000,      // 1000 requests per hour
    business: 5000, // 5000 requests per hour
    enterprise: -1  // Unlimited
  };

  // Add rate limit info to request
  req.rateLimit = {
    limit: limits[plan],
    remaining: limits[plan] // This would be calculated based on actual usage
  };

  next();
};

/**
 * Check if user owns resource middleware
 * @param {string} resourceField - Field name that contains user ID
 */
const checkOwnership = (resourceField = 'userId') => {
  return (req, res, next) => {
    const resourceId = req.params.id || req.body.id;
    const userId = req.user.id;

    // For admin users, allow access to all resources
    if (req.user.role === 'admin') {
      return next();
    }

    // This would typically fetch the resource and check ownership
    // For now, we'll assume the resource has a userId field
    // In a real implementation, you'd query the database
    
    next();
  };
};

/**
 * Feature flag middleware
 * @param {string} feature - Feature name to check
 */
const requireFeature = (feature) => {
  return (req, res, next) => {
    // This would check against a feature flag system
    const enabledFeatures = {
      'ai-analysis': ['pro', 'business', 'enterprise'],
      'team-collaboration': ['business', 'enterprise'],
      'custom-integrations': ['enterprise'],
      'white-label': ['enterprise']
    };

    const userPlan = req.user?.subscription?.plan || 'free';
    const requiredPlans = enabledFeatures[feature] || [];

    if (!requiredPlans.includes(userPlan)) {
      return res.status(403).json({
        success: false,
        message: `Feature '${feature}' not available for ${userPlan} plan`,
        requiredPlans
      });
    }

    next();
  };
};

module.exports = {
  auth,
  authorize,
  requireSubscription,
  requireEmailVerification,
  apiKeyAuth,
  optionalAuth,
  userTierRateLimit,
  checkOwnership,
  requireFeature
};