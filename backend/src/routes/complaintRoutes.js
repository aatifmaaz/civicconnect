/**
 * Complaint Routes
 * Handles all complaint-related endpoints
 */

const express = require('express');
const ComplaintController = require('../controllers/complaintController');
const { authenticateToken, requireAdmin, requireCitizen } = require('../middleware/auth');
const { uploadSingleFile } = require('../utils/fileUpload');

const router = express.Router();

const maybeUploadSingleFile = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return uploadSingleFile(req, res, next);
  }

  return next();
};

// All complaint routes require authentication
router.use(authenticateToken);

// Citizen routes
router.post(
  '/create',
  requireCitizen,
  maybeUploadSingleFile,
  ComplaintController.createComplaint
);

router.get(
  '/my-complaints',
  requireCitizen,
  ComplaintController.getUserComplaints
);

// Get complaint by ID
router.get('/:complaintId', ComplaintController.getComplaintById);

// Get activity logs
router.get('/:complaintId/logs', ComplaintController.getActivityLogs);

// Admin routes
router.get('/', requireAdmin, ComplaintController.getAllComplaints);

router.patch(
  '/:complaintId/status',
  requireAdmin,
  ComplaintController.updateComplaintStatus
);

router.put(
  '/:complaintId/status',
  requireAdmin,
  ComplaintController.updateComplaintStatus
);

router.post(
  '/:complaintId/assign',
  requireAdmin,
  ComplaintController.assignComplaint
);

router.get('/stats/analytics', requireAdmin, ComplaintController.getStatistics);

// Delete complaint
router.delete('/:complaintId', ComplaintController.deleteComplaint);

module.exports = router;
