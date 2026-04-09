const AnnouncementService = require('../services/AnnouncementService');

class AnnouncementController {
  static async getActiveAnnouncements(req, res, next) {
    try {
      // STRICT ENFORCEMENT: Non-admin users MUST have their taluk set and be filtered accordingly
      let queryTaluk = null;
      
      if (req.user && req.user.role === 'admin') {
        // Admins can optionally filter by taluk via query param (for viewing what users see)
        queryTaluk = req.query.taluk || null;
      } else if (req.user) {
        // Non-admin users: fetch their taluk and filter strictly by it
        queryTaluk = req.user.taluk || null;
        
        // If user's taluk is not in req.user, fetch from DB
        if (!queryTaluk) {
          try {
            const { pool } = require('../config/database');
            const [rows] = await pool.execute('SELECT taluk FROM users WHERE id = ?', [req.user.id]);
            if (rows.length > 0) queryTaluk = rows[0].taluk || null;
          } catch (err) {
            console.error('Failed to fetch user taluk from DB:', err);
          }
        }
        
        // CRITICAL: If still no taluk for non-admin user, only show global announcements
        // This prevents showing taluk-specific announcements to users without registered taluk
        if (!queryTaluk) {
          queryTaluk = '__GLOBAL_ONLY__';
          console.warn(`User ${req.user.id} has no taluk registered; showing only global announcements`);
        }
      }
      
      const result = await AnnouncementService.getActiveAnnouncements(queryTaluk || null);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getAllAnnouncements(req, res, next) {
    try {
      // STRICT ENFORCEMENT: Same as getActiveAnnouncements - users filtered by taluk
      let queryTaluk = null;
      
      if (req.user && req.user.role === 'admin') {
        // Admins can optionally filter by taluk via query param
        queryTaluk = req.query.taluk || null;
      } else if (req.user) {
        // Non-admin users: filtered strictly by their taluk
        queryTaluk = req.user.taluk || null;
        
        // Fallback: fetch from DB if not in req.user
        if (!queryTaluk) {
          try {
            const { pool } = require('../config/database');
            const [rows] = await pool.execute('SELECT taluk FROM users WHERE id = ?', [req.user.id]);
            if (rows.length > 0) queryTaluk = rows[0].taluk || null;
          } catch (err) {
            console.error('Failed to fetch user taluk from DB:', err);
          }
        }
        
        // CRITICAL: If no taluk, only show global announcements
        if (!queryTaluk) {
          queryTaluk = '__GLOBAL_ONLY__';
          console.warn(`User ${req.user.id} has no taluk registered; showing only global announcements`);
        }
      }
      
      const result = await AnnouncementService.getAllAnnouncements(queryTaluk || null);
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

module.exports = AnnouncementController;
