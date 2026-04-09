/**
 * JWT Utility Functions
 * Handles token generation, verification, and decoding
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

/**
 * Generate JWT Token
 * @param {Object} payload - Data to encode in token
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
  try {
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRY,
      algorithm: 'HS256'
    });
    return token;
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Failed to generate token');
  }
};

/**
 * Verify JWT Token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256']
    });
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
};

/**
 * Decode Token without Verification (for info only)
 * @param {string} token - JWT token to decode
 * @returns {Object} Decoded token payload
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    throw new Error('Failed to decode token');
  }
};

/**
 * Generate tokens for successful login
 * @param {Object} user - User data
 * @returns {Object} Tokens and user info
 */
const generateAuthTokens = (user) => {
  const accessToken = generateToken({
    id: user.id,
    phone: user.phone,
    role: user.role
  });

  const refreshToken = generateToken({
    id: user.id,
    type: 'refresh'
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_EXPIRY
  };
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  generateAuthTokens
};
