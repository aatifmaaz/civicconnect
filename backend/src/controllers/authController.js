/**
 * Authentication Controller
 * Handles authentication-related HTTP requests — email/password based
 */

const AuthService = require('../services/AuthService');

class AuthController {
  /**
   * POST /auth/register
   */
  static async register(req, res, next) {
    try {
      const { name, phone, email, address, district, taluk, password } = req.body;

      if (!name || !phone || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name, phone, email, and password are required',
        });
      }

      if (!district || !taluk) {
        return res.status(400).json({
          success: false,
          message: 'District and taluk selection are required',
        });
      }

      if (!/^[0-9]{10}$/.test(phone)) {
        return res.status(400).json({ success: false, message: 'Phone number must be 10 digits' });
      }

      if (!/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
      }

      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }

      const result = await AuthService.register(name, phone, email, address, district, taluk, password);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }

      const result = await AuthService.login(email, password);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /auth/profile
   */
  static async getProfile(req, res, next) {
    try {
      const result = await AuthService.getUserProfile(req.user.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /auth/profile
   */
  static async updateProfile(req, res, next) {
    try {
      const { name, email, address, latitude, longitude } = req.body;
      const result = await AuthService.updateUserProfile(req.user.id, { name, email, address, latitude, longitude });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /auth/change-password
   */
  static async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword, confirmPassword } = req.body;

      if (!oldPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ success: false, message: 'All password fields are required' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
      }
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'New passwords do not match' });
      }

      const result = await AuthService.changePassword(req.user.id, oldPassword, newPassword);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/forgot-password/request
   */
  static async requestPasswordReset(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }

      const result = await AuthService.requestPasswordReset(email);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/forgot-password/verify
   */
  static async verifyPasswordResetOtp(req, res, next) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email and OTP are required' });
      }

      const result = await AuthService.verifyPasswordResetOtp(email, otp);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/forgot-password/reset
   */
  static async resetPasswordWithOtp(req, res, next) {
    try {
      const { email, otp, newPassword, confirmPassword } = req.body;

      if (!email || !otp || !newPassword || !confirmPassword) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Passwords do not match' });
      }

      const result = await AuthService.resetPasswordWithOtp(email, otp, newPassword);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Health check
   */
  static async healthCheck(req, res) {
    return res.status(200).json({ success: true, message: 'Auth service is running', timestamp: new Date() });
  }
}

module.exports = AuthController;
