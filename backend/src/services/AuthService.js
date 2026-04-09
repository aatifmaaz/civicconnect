/**
 * Authentication Service
 * Email + Password based auth with mandatory phone number
 */

const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const { generateAuthTokens } = require('../utils/jwt');
const { generateOTP, verifyOTP, calculateOTPExpiry } = require('../utils/otp');
const { sendPasswordResetOtpEmail } = require('../utils/sendEmail');

class AuthService {
  /**
   * Register a new user with email + password + phone
   */
  static async register(name, phone, email, address, district, taluk, password) {
    const connection = await pool.getConnection();
    try {
      // Check if email already exists
      const [byEmail] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );
      if (byEmail.length > 0) {
        throw { statusCode: 409, message: 'An account with this email already exists' };
      }

      // Check if phone already exists
      const [byPhone] = await connection.execute(
        'SELECT id FROM users WHERE phone = ?',
        [phone]
      );
      if (byPhone.length > 0) {
        throw { statusCode: 409, message: 'An account with this phone number already exists' };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      const [result] = await connection.execute(
        `INSERT INTO users (name, email, phone, address, district, taluk, role, password_hash, is_verified, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 'citizen', ?, 1, 1)`,
        [name, email, phone, address || null, district, taluk, hashedPassword]
      );

      const [newUser] = await connection.execute(
        'SELECT id, name, email, phone, address, district, taluk, role FROM users WHERE id = ?',
        [result.insertId]
      );

      const user = newUser[0];
      const tokens = generateAuthTokens({ id: user.id, phone: user.phone, role: user.role, district: user.district, taluk: user.taluk });

      return {
        success: true,
        message: 'Account created successfully',
        user,
        ...tokens,
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Login with email + password
   */
  static async login(email, password) {
    const connection = await pool.getConnection();
    try {
      const [users] = await connection.execute(
        'SELECT * FROM users WHERE email = ? AND is_verified = 1',
        [email]
      );

      if (users.length === 0) {
        throw { statusCode: 401, message: 'Invalid email or password' };
      }

      const user = users[0];

      if (!user.is_active) {
        throw { statusCode: 403, message: 'Your account has been deactivated. Contact support.' };
      }

      // Compare password
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        throw { statusCode: 401, message: 'Invalid email or password' };
      }

      const tokens = generateAuthTokens({ id: user.id, phone: user.phone, role: user.role, district: user.district, taluk: user.taluk });

      return {
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          address: user.address,
          district: user.district,
          taluk: user.taluk,
        },
        ...tokens,
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get user profile
   */
  static async getUserProfile(userId) {
    const connection = await pool.getConnection();
    try {
      const [users] = await connection.execute(
        'SELECT id, name, email, phone, address, district, taluk, role, latitude, longitude, created_at FROM users WHERE id = ?',
        [userId]
      );
      if (users.length === 0) throw { statusCode: 404, message: 'User not found' };
      return { success: true, user: users[0] };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId, updateData) {
    const connection = await pool.getConnection();
    try {
      const { name, email, address, latitude, longitude } = updateData;
      await connection.execute(
        `UPDATE users 
         SET name = COALESCE(?, name),
             email = COALESCE(?, email),
             address = COALESCE(?, address),
             latitude = COALESCE(?, latitude),
             longitude = COALESCE(?, longitude)
         WHERE id = ?`,
        [name, email, address, latitude, longitude, userId]
      );
      const [users] = await connection.execute(
        'SELECT id, name, email, phone, address, role, latitude, longitude FROM users WHERE id = ?',
        [userId]
      );
      return { success: true, message: 'Profile updated successfully', user: users[0] };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Change password
   */
  static async changePassword(userId, oldPassword, newPassword) {
    const connection = await pool.getConnection();
    try {
      const [users] = await connection.execute(
        'SELECT password_hash FROM users WHERE id = ?',
        [userId]
      );
      if (users.length === 0) throw { statusCode: 404, message: 'User not found' };

      const passwordMatch = await bcrypt.compare(oldPassword, users[0].password_hash);
      if (!passwordMatch) throw { statusCode: 401, message: 'Current password is incorrect' };

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await connection.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);

      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Request password reset by email + OTP
   */
  static async requestPasswordReset(email) {
    const connection = await pool.getConnection();
    try {
      const [users] = await connection.execute(
        'SELECT id, name, email, is_active FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        throw { statusCode: 404, message: 'No account found with this email' };
      }

      const user = users[0];

      if (!user.is_active) {
        throw { statusCode: 403, message: 'Your account is deactivated. Contact support.' };
      }

      const otp = generateOTP(6);
      const otpExpiry = calculateOTPExpiry(10);

      await connection.execute(
        'UPDATE users SET otp = ?, otp_expires_at = ? WHERE id = ?',
        [otp, otpExpiry, user.id]
      );

      await sendPasswordResetOtpEmail(user.email, user.name, otp, otpExpiry);

      return {
        success: true,
        message: 'OTP sent to your email'
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Verify password reset OTP
   */
  static async verifyPasswordResetOtp(email, otp) {
    const connection = await pool.getConnection();
    try {
      const [users] = await connection.execute(
        'SELECT id, otp, otp_expires_at FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        throw { statusCode: 404, message: 'No account found with this email' };
      }

      const user = users[0];
      const isValid = verifyOTP(String(otp), String(user.otp || ''), user.otp_expires_at);

      if (!isValid) {
        throw { statusCode: 400, message: 'Invalid or expired OTP' };
      }

      return { success: true, message: 'OTP verified' };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Reset password with OTP
   */
  static async resetPasswordWithOtp(email, otp, newPassword) {
    const connection = await pool.getConnection();
    try {
      const [users] = await connection.execute(
        'SELECT id, otp, otp_expires_at FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        throw { statusCode: 404, message: 'No account found with this email' };
      }

      const user = users[0];
      const isValid = verifyOTP(String(otp), String(user.otp || ''), user.otp_expires_at);

      if (!isValid) {
        throw { statusCode: 400, message: 'Invalid or expired OTP' };
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await connection.execute(
        'UPDATE users SET password_hash = ?, otp = NULL, otp_expires_at = NULL WHERE id = ?',
        [hashedPassword, user.id]
      );

      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = AuthService;
