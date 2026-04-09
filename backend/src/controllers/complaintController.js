/**
 * Complaint Controller
 * Handles complaint-related HTTP requests
 */

const ComplaintService = require('../services/ComplaintService');
const { uploadSingleFile } = require('../utils/fileUpload');

class ComplaintController {
  /**
   * Create new complaint with image upload
   */
  static async createComplaint(req, res, next) {
    try {
      const userId = req.user.id;
      const { title, description, category, latitude, longitude, address, priority, district, taluk } = req.body;

      // Validation
      if (!title || !description || !category || !latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'All required fields must be provided'
        });
      }

      // Get image URL if uploaded
      let imageUrl = null;
      if (req.file) {
        imageUrl = req.file.path || req.file.secure_url || req.file.url || null;
      }

      // Create complaint
      const result = await ComplaintService.createComplaint(
        userId,
        title,
        description,
        category,
        imageUrl,
        latitude,
        longitude,
        address,
        priority || 'medium',
        district || null,
        taluk || null
      );

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get complaint by ID
   */
  static async getComplaintById(req, res, next) {
    try {
      const { complaintId } = req.params;
      const userId = req.user.id;

      const complaint = await ComplaintService.getComplaintById(complaintId);

      // Verify ownership if citizen
      if (req.user.role === 'citizen' && complaint.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only view your own complaints'
        });
      }

      return res.status(200).json({
        success: true,
        complaint: complaint
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's complaints
   */
  static async getUserComplaints(req, res, next) {
    try {
      const userId = req.user.id;
      const { status, category, priority, page = 1, limit = 10 } = req.query;

      const result = await ComplaintService.getComplaintsByUser(
        userId,
        { status, category, priority },
        parseInt(page),
        parseInt(limit)
      );

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all complaints (admin only)
   */
  static async getAllComplaints(req, res, next) {
    try {
      const { status, category, priority, assignedTo, search, page = 1, limit = 20 } = req.query;

      // Geo-routing: pass admin's taluk if they are a municipal admin (not superadmin)
      const adminTaluk = (!req.user.superadmin && req.user.taluk) ? req.user.taluk : null;

      const result = await ComplaintService.getAllComplaints(
        { status, category, priority, assignedTo, search, adminTaluk },
        parseInt(page),
        parseInt(limit)
      );

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update complaint status (admin only)
   */
  static async updateComplaintStatus(req, res, next) {
    try {
      const { complaintId } = req.params;
      const adminId = req.user.id;
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      const result = await ComplaintService.updateComplaintStatus(
        complaintId,
        status,
        adminId,
        notes
      );

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign complaint to admin
   */
  static async assignComplaint(req, res, next) {
    try {
      const { complaintId } = req.params;
      const { adminId } = req.body;
      const assignedById = req.user.id;

      if (!adminId) {
        return res.status(400).json({
          success: false,
          message: 'Admin ID is required'
        });
      }

      const result = await ComplaintService.assignComplaint(
        complaintId,
        adminId,
        assignedById
      );

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get activity logs for complaint
   */
  static async getActivityLogs(req, res, next) {
    try {
      const { complaintId } = req.params;

      const result = await ComplaintService.getActivityLogs(complaintId);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get statistics
   */
  static async getStatistics(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      const result = await ComplaintService.getStatistics({
        startDate,
        endDate
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete complaint
   */
  static async deleteComplaint(req, res, next) {
    try {
      const { complaintId } = req.params;
      const userId = req.user.id;

      // Verify ownership
      const complaint = await ComplaintService.getComplaintById(complaintId);
      if (complaint.user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this complaint'
        });
      }

      const result = await ComplaintService.deleteComplaint(complaintId);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ComplaintController;
