/**
 * Authentication Routes
 * Email + Password based authentication
 */

const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const {
  validateForgotPasswordRequest,
  validateForgotPasswordVerify,
  validateForgotPasswordReset
} = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/forgot-password/request', validateForgotPasswordRequest, AuthController.requestPasswordReset);
router.post('/forgot-password/verify', validateForgotPasswordVerify, AuthController.verifyPasswordResetOtp);
router.post('/forgot-password/reset', validateForgotPasswordReset, AuthController.resetPasswordWithOtp);

// Protected routes
router.get('/profile', authenticateToken, AuthController.getProfile);
router.put('/profile', authenticateToken, AuthController.updateProfile);
router.post('/change-password', authenticateToken, AuthController.changePassword);

// Health check
router.get('/health', AuthController.healthCheck);

module.exports = router;
