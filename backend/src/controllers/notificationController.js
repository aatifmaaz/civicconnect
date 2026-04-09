/**
 * Notification Controller
 * Handles notification-related HTTP requests
 */

const NotificationService = require('../services/NotificationService');

class NotificationController {
  /**
   * Get user notifications with pagination
   */
  static async getNotifications(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;

      const result = await NotificationService.getUserNotifications(
        userId,
        parseInt(page),
        parseInt(limit)
      );

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await NotificationService.getUnreadCount(userId);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark single notification as read
   */
  static async markAsRead(req, res, next) {
    try {
      const { notificationId } = req.params;
      const result = await NotificationService.markAsRead(notificationId);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await NotificationService.markAllAsRead(userId);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(req, res, next) {
    try {
      const { notificationId } = req.params;
      const result = await NotificationService.deleteNotification(notificationId);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete all notifications for a user
   */
  static async deleteAllNotifications(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await NotificationService.deleteAllNotifications(userId);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = NotificationController;
