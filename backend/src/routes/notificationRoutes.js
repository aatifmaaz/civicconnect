/**
 * Notification Routes
 * Handles all notification-related endpoints
 */

const express = require('express');
const NotificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All notification routes require authentication
router.use(authenticateToken);

// Get all notifications for user
router.get('/', NotificationController.getNotifications);

// Get unread count
router.get('/unread-count/fetch', NotificationController.getUnreadCount);

// Mark as read
router.put('/:notificationId/read', NotificationController.markAsRead);

// Mark all as read
router.post('/mark-all/read', NotificationController.markAllAsRead);

// Delete notification
router.delete('/:notificationId/delete', NotificationController.deleteNotification);

// Delete all notifications
router.post('/delete-all/purge', NotificationController.deleteAllNotifications);

module.exports = router;
