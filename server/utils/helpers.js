const crypto = require('crypto');
const moment = require('moment');

/**
 * Generate a unique scan ID
 * @returns {string} Unique scan identifier
 */
function generateScanId() {
  const timestamp = Date.now().toString(36);
  const randomBytes = crypto.randomBytes(6).toString('hex');
  return `scan_${timestamp}_${randomBytes}`;
}

/**
 * Generate a unique alert ID
 * @returns {string} Unique alert identifier
 */
function generateAlertId() {
  const timestamp = Date.now().toString(36);
  const randomBytes = crypto.randomBytes(4).toString('hex');
  return `alert_${timestamp}_${randomBytes}`;
}

/**
 * Generate a secure API key
 * @returns {string} Secure API key
 */
function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a secure random token
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} Secure random token
 */
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a password using crypto
 * @param {string} password - Plain text password
 * @param {string} salt - Salt for hashing (optional)
 * @returns {object} Hash and salt
 */
function hashPassword(password, salt = null) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  
  return { hash, salt };
}

/**
 * Verify a password against its hash
 * @param {string} password - Plain text password
 * @param {string} hash - Stored hash
 * @param {string} salt - Stored salt
 * @returns {boolean} Password is valid
 */
function verifyPassword(password, hash, salt) {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

/**
 * Sanitize input string
 * @param {string} input - Input string
 * @returns {string} Sanitized string
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>\"']/g, '') // Remove potentially dangerous characters
    .substring(0, 1000); // Limit length
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} Email is valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate IP address format
 * @param {string} ip - IP address
 * @returns {boolean} IP is valid
 */
function isValidIP(ip) {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}

/**
 * Validate domain name format
 * @param {string} domain - Domain name
 * @returns {boolean} Domain is valid
 */
function isValidDomain(domain) {
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
  return domainRegex.test(domain);
}

/**
 * Validate URL format
 * @param {string} url - URL
 * @returns {boolean} URL is valid
 */
function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format bytes to human readable format
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted bytes
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format duration from milliseconds
 * @param {number} ms - Milliseconds
 * @returns {string} Formatted duration
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  return `${Math.round(ms / 3600000)}h`;
}

/**
 * Get relative time string
 * @param {Date} date - Date object
 * @returns {string} Relative time
 */
function getRelativeTime(date) {
  return moment(date).fromNow();
}

/**
 * Calculate risk score based on vulnerabilities
 * @param {Array} vulnerabilities - Array of vulnerabilities
 * @returns {number} Risk score (0-100)
 */
function calculateRiskScore(vulnerabilities) {
  if (!vulnerabilities || vulnerabilities.length === 0) return 0;

  const weights = {
    critical: 10,
    high: 7,
    medium: 4,
    low: 2,
    info: 1
  };

  let totalRisk = 0;
  vulnerabilities.forEach(vuln => {
    totalRisk += weights[vuln.severity] || 1;
  });

  // Normalize to 0-100 scale
  return Math.min(100, Math.round(totalRisk * 2));
}

/**
 * Calculate CVSS score category
 * @param {number} score - CVSS score (0-10)
 * @returns {string} Severity category
 */
function getCVSSSeverity(score) {
  if (score >= 9.0) return 'critical';
  if (score >= 7.0) return 'high';
  if (score >= 4.0) return 'medium';
  if (score > 0.0) return 'low';
  return 'info';
}

/**
 * Paginate results
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Items per page
 * @returns {object} Skip and limit values
 */
function getPagination(page = 1, limit = 10) {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  return {
    skip,
    limit: limitNum,
    page: pageNum
  };
}

/**
 * Create pagination metadata
 * @param {number} totalItems - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} Pagination metadata
 */
function createPaginationMeta(totalItems, page, limit) {
  const totalPages = Math.ceil(totalItems / limit);
  
  return {
    currentPage: page,
    totalPages,
    totalItems,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null
  };
}

/**
 * Escape HTML special characters
 * @param {string} text - Input text
 * @returns {string} Escaped text
 */
function escapeHTML(text) {
  if (typeof text !== 'string') return text;
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Generate a random color hex code
 * @returns {string} Hex color code
 */
function randomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Sleep promise
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxAttempts - Maximum retry attempts
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} Result or rejection
 */
async function retryWithBackoff(fn, maxAttempts = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Deep clone an object
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    Object.keys(obj).forEach(key => {
      clonedObj[key] = deepClone(obj[key]);
    });
    return clonedObj;
  }
  return obj;
}

/**
 * Remove sensitive information from objects
 * @param {object} obj - Object to sanitize
 * @param {Array} sensitiveFields - Fields to remove
 * @returns {object} Sanitized object
 */
function removeSensitiveFields(obj, sensitiveFields = ['password', 'token', 'secret', 'key']) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = deepClone(obj);
  
  function removeFields(current) {
    if (Array.isArray(current)) {
      return current.map(item => removeFields(item));
    }
    
    if (current && typeof current === 'object') {
      const result = {};
      Object.keys(current).forEach(key => {
        if (!sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          result[key] = removeFields(current[key]);
        }
      });
      return result;
    }
    
    return current;
  }
  
  return removeFields(sanitized);
}

module.exports = {
  generateScanId,
  generateAlertId,
  generateApiKey,
  generateSecureToken,
  hashPassword,
  verifyPassword,
  sanitizeInput,
  isValidEmail,
  isValidIP,
  isValidDomain,
  isValidURL,
  formatBytes,
  formatDuration,
  getRelativeTime,
  calculateRiskScore,
  getCVSSSeverity,
  getPagination,
  createPaginationMeta,
  escapeHTML,
  randomColor,
  sleep,
  retryWithBackoff,
  deepClone,
  removeSensitiveFields
};