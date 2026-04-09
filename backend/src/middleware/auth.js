/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */

const { verifyToken, decodeToken } = require('../utils/jwt');

/**
 * Verify JWT Token Middleware
 * Extracts and validates the JWT token from Authorization header
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required. Please login.',
        code: 'NO_TOKEN'
      });
    }

    // Verify token
    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      req.token = token;

      // Enrich req.user with district/taluk from DB for accurate geo-filtering
      try {
        const { pool } = require('../config/database');
        const [rows] = await pool.execute('SELECT district, taluk FROM users WHERE id = ?', [req.user.id]);
        if (rows.length > 0) {
          req.user.district = rows[0].district || null;
          req.user.taluk = rows[0].taluk || null;
        }
      } catch (dbErr) {
        // Non-fatal: proceed without taluk info (will be handled by controller)
        console.error('Failed to enrich user with taluk info:', dbErr);
      }

      next();
    } catch (error) {
      if (error.message.includes('expired')) {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(403).json({
        success: false,
        message: 'Invalid or malformed token.',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Verify Admin Role
 * Ensures the authenticated user has admin role
 */
const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'NOT_AUTHENTICATED'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
      code: 'INSUFFICIENT_PRIVILEGES'
    });
  }

  // Enrich req.user with taluk/district from DB for geo-routing
  try {
    const { pool } = require('../config/database');
    const [rows] = await pool.execute(
      'SELECT district, taluk FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length > 0) {
      req.user.district = rows[0].district || null;
      req.user.taluk = rows[0].taluk || null;
      req.user.superadmin = !rows[0].taluk;
    }
  } catch (err) {
    console.error('Failed to enrich admin user with taluk:', err);
    // Non-fatal: proceed without taluk (acts as super admin)
    req.user.superadmin = true;
  }

  next();
};

/**
 * Verify Citizen Role
 * Ensures the authenticated user has citizen role
 */
const requireCitizen = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'NOT_AUTHENTICATED'
    });
  }

  if (req.user.role !== 'citizen') {
    return res.status(403).json({
      success: false,
      message: 'Citizen access required',
      code: 'INSUFFICIENT_PRIVILEGES'
    });
  }

  next();
};

/**
 * Optional Authentication
 * Verifies token if provided, but doesn't fail if missing
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = verifyToken(token);
        req.user = decoded;
        req.token = token;
      } catch (error) {
        // Token is optional, so we just ignore validation errors
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireCitizen,
  optionalAuth
};
