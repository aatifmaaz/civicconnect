/**
 * Notification Service
 * Handles user notifications
 */

const { pool } = require('../config/database');

class NotificationService {
  /**
   * Get user notifications with pagination
   */
  static async getUserNotifications(userId, page = 1, limit = 20) {
    const connection = await pool.getConnection();
    try {
      const parsedLimit = Number(limit) || 20;
      const parsedOffset = Number((page - 1) * parsedLimit) || 0;

      // Get total count
      const [countResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?',
        [userId]
      );

      // Get paginated notifications
      const [notifications] = await connection.execute(
        `SELECT id, complaint_id, title, message, type, is_read, created_at
         FROM notifications WHERE user_id = ?
         ORDER BY is_read ASC, created_at DESC LIMIT ${parsedLimit} OFFSET ${parsedOffset}`,
        [userId]
      );

      return {
        success: true,
        notifications: notifications,
        pagination: {
          total: countResult[0].total,
          page: Number(page),
          limit: parsedLimit,
          pages: Math.ceil(countResult[0].total / parsedLimit)
        }
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Mark single notification as read
   */
  static async markAsRead(notificationId) {
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        'UPDATE notifications SET is_read = 1 WHERE id = ?',
        [notificationId]
      );

      return {
        success: true,
        message: 'Notification marked as read'
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId) {
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
        [userId]
      );

      return {
        success: true,
        message: 'All notifications marked as read'
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        'SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0',
        [userId]
      );

      return {
        success: true,
        unread: result[0].unread
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        'DELETE FROM notifications WHERE id = ?',
        [notificationId]
      );

      if (result.affectedRows === 0) {
        throw {
          statusCode: 404,
          message: 'Notification not found'
        };
      }

      return {
        success: true,
        message: 'Notification deleted'
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Delete all notifications for a user
   */
  static async deleteAllNotifications(userId) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        'DELETE FROM notifications WHERE user_id = ?',
        [userId]
      );

      return {
        success: true,
        message: 'All notifications deleted',
        deleted: result.affectedRows
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Create notification (internal use)
   */
  static async createNotification(userId, complaintId, title, message, type = 'status_update') {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        `INSERT INTO notifications (user_id, complaint_id, title, message, type)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, complaintId, title, message, type]
      );

      return {
        success: true,
        notificationId: result.insertId
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get notifications by complaint
   */
  static async getNotificationsByComplaint(complaintId) {
    const connection = await pool.getConnection();
    try {
      const [notifications] = await connection.execute(
        `SELECT * FROM notifications WHERE complaint_id = ? ORDER BY created_at DESC`,
        [complaintId]
      );

      return {
        success: true,
        notifications: notifications
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = NotificationService;
