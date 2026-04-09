/**
 * Admin Controller
 * Handles admin-specific operations
 */

const AdminService = require('../services/AdminService');
const AnnouncementService = require('../services/AnnouncementService');

class AdminController {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(req, res, next) {
    try {
      const result = await AdminService.getDashboardStats();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all users
   */
  static async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await AdminService.getAllUsers(parseInt(page), parseInt(limit));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivate user
   */
  static async deactivateUser(req, res, next) {
    try {
      const { userId } = req.params;
      const result = await AdminService.deactivateUser(userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activate user
   */
  static async activateUser(req, res, next) {
    try {
      const { userId } = req.params;
      const result = await AdminService.activateUser(userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user permanently
   */
  static async deleteUser(req, res, next) {
    try {
      const { userId } = req.params;
      const result = await AdminService.deleteUser(userId);
      return res.status(200).json(result);
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  /**
   * Get complaints by location
   */
  static async getComplaintsByLocation(req, res, next) {
    try {
      const { latitude, longitude, radius = 5 } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
      }

      const result = await AdminService.getComplaintsByLocation(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(radius)
      );

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export complaints
   */
  static async exportComplaints(req, res, next) {
    try {
      const { format = 'json', status, startDate, endDate } = req.query;

      const result = await AdminService.exportComplaints(format, {
        status,
        startDate,
        endDate
      });

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="complaints.csv"');
        return res.send(convertToCSV(result.data));
      }

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign taluk + district to an admin user (super admin only)
   */
  static async assignTalukToAdmin(req, res, next) {
    try {
      const { userId } = req.params;
      const { district, taluk } = req.body;

      if (req.user.taluk) {
        return res.status(403).json({
          success: false,
          message: 'Only super admins can assign taluks to other admins'
        });
      }

      if (!district || !taluk) {
        return res.status(400).json({ success: false, message: 'District and taluk are required' });
      }
      const result = await AdminService.assignTalukToAdmin(userId, district, taluk);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getAnnouncements(req, res, next) {
    try {
      // Admin can view their taluk's announcements (or all if super admin with no taluk)
      const result = await AnnouncementService.getAllAnnouncements(req.user.taluk || null);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async createAnnouncement(req, res, next) {
    try {
      const { title, content, isPermanent = false, expiresAt = null, district, taluk } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: 'Title and content are required'
        });
      }

      if (!district || !taluk) {
        return res.status(400).json({
          success: false,
          message: 'District and taluk selection are required'
        });
      }

      const result = await AnnouncementService.createAnnouncement({
        title: title.trim(),
        content: content.trim(),
        isPermanent: Boolean(isPermanent),
        expiresAt,
        createdBy: req.user.id,
        district,
        taluk
      });

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteAnnouncement(req, res, next) {
    try {
      const result = await AnnouncementService.deleteAnnouncement(req.params.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj =>
    Object.values(obj).map(val =>
      typeof val === 'string' ? `"${val}"` : val
    ).join(',')
  );
  return [headers, ...rows].join('\n');
}

module.exports = AdminController;
