/**
 * Admin Routes
 * Handles admin-specific operations
 */

const express = require('express');
const AdminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

// Dashboard
router.get('/dashboard', AdminController.getDashboardStats);

// User management
router.get('/users', AdminController.getAllUsers);
router.post('/users/:userId/deactivate', AdminController.deactivateUser);
router.post('/users/:userId/activate', AdminController.activateUser);
router.patch('/users/:userId/assign-taluk', AdminController.assignTalukToAdmin);
router.delete('/users/:userId', AdminController.deleteUser);

// Municipality updates
router.get('/announcements', AdminController.getAnnouncements);
router.post('/announcements', AdminController.createAnnouncement);
router.delete('/announcements/:id', AdminController.deleteAnnouncement);

// Location-based complaints
router.get('/complaints/nearby', AdminController.getComplaintsByLocation);

// Export data
router.get('/export/complaints', AdminController.exportComplaints);

module.exports = router;
