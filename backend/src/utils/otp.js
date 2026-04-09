/**
 * OTP Utility Functions
 * Handles OTP generation, validation, and expiry
 */

const crypto = require('crypto');

/**
 * Generate OTP (One-Time Password)
 * @param {number} length - OTP length (default: 6)
 * @returns {string} OTP code
 */
const generateOTP = (length = 6) => {
  try {
    // For production, use cryptographically secure random
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    const otp = Math.floor(Math.random() * (max - min + 1)) + min;
    return otp.toString().padStart(length, '0');
  } catch (error) {
    console.error('OTP generation error:', error);
    throw new Error('Failed to generate OTP');
  }
};

/**
 * Verify OTP
 * @param {string} providedOTP - OTP provided by user
 * @param {string} storedOTP - OTP stored in database
 * @param {Date} expiresAt - OTP expiry timestamp
 * @returns {boolean} True if OTP is valid
 */
const verifyOTP = (providedOTP, storedOTP, expiresAt) => {
  try {
    // Check if OTP matches
    if (providedOTP !== storedOTP) {
      return false;
    }

    // Check if OTP has expired
    if (new Date() > new Date(expiresAt)) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('OTP verification error:', error);
    return false;
  }
};

/**
 * Calculate OTP expiry time
 * @param {number} minutesFromNow - Minutes from now
 * @returns {Date} Expiry timestamp
 */
const calculateOTPExpiry = (minutesFromNow = 5) => {
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + minutesFromNow);
  return expiryTime;
};

/**
 * Mock OTP - Returns predefined OTP for testing
 * @param {string} phone - Phone number
 * @returns {string} Mock OTP
 */
const getMockOTP = (phone) => {
  // In production, remove this function
  // For testing: return 123456 for any phone
  return '123456';
};

module.exports = {
  generateOTP,
  verifyOTP,
  calculateOTPExpiry,
  getMockOTP
};
