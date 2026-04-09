const { pool } = require('../config/database');
const NotificationService = require('./NotificationService');
const { sendMunicipalityUpdateEmail } = require('../utils/sendEmail');

class AnnouncementService {
  static async getActiveAnnouncements(taluk = null) {
    const connection = await pool.getConnection();
    try {
      let query = `SELECT a.id, a.title, a.content, a.is_permanent, a.expires_at, a.created_at, a.district, a.taluk,
                u.name AS created_by_name
         FROM announcements a
         LEFT JOIN users u ON a.created_by = u.id
        WHERE (a.is_permanent = 1 OR (a.expires_at IS NOT NULL AND a.expires_at > NOW()))`;

      const params = [];

      // Strict filtering: 
      // - If taluk is provided, only show announcements to that taluk
      // - If taluk is '__GLOBAL_ONLY__', only show global announcements (no taluk)
      // - This ensures announcements created for taluk X are only visible to users from taluk X
      if (taluk === '__GLOBAL_ONLY__') {
        query += ` AND a.taluk IS NULL`;
      } else if (taluk) {
        // Normalize comparison: ignore whitespace/case differences
        // Match announcements with matching taluk (case-insensitive, trim whitespace)
        query += ` AND (a.taluk IS NULL OR LOWER(TRIM(a.taluk)) = LOWER(TRIM(?)))`;
        params.push(taluk);
      } else {
        // If no taluk is provided and not a special marker, show all announcements
        // (This should not happen in normal flow but kept for safety)
      }
      
      query += ` ORDER BY a.is_permanent DESC, a.created_at DESC`;

      const [announcements] = await connection.execute(query, params);

      return {
        success: true,
        data: announcements
      };
    } finally {
      connection.release();
    }
  }

  static async getAllAnnouncements(taluk = null) {
    const connection = await pool.getConnection();
    try {
      let query = `SELECT a.id, a.title, a.content, a.is_permanent, a.expires_at, a.created_at, a.updated_at, a.district, a.taluk,
                u.name AS created_by_name,
                CASE
                  WHEN a.is_permanent = 1 THEN 'Permanent'
                  WHEN a.expires_at IS NOT NULL AND a.expires_at > NOW() THEN 'Active'
                  ELSE 'Expired'
                END AS visibility_status
         FROM announcements a
         LEFT JOIN users u ON a.created_by = u.id`;
      
      const params = [];

      // Strict filtering: 
      // - If taluk is provided, only show announcements to that taluk
      // - If taluk is '__GLOBAL_ONLY__', only show global announcements (no taluk)
      // - This ensures announcements created for taluk X are only visible to users from taluk X
      if (taluk === '__GLOBAL_ONLY__') {
        query += ` WHERE a.taluk IS NULL`;
      } else if (taluk) {
        // Normalize comparison: ignore whitespace/case differences
        // Match announcements with matching taluk (case-insensitive, trim whitespace)
        query += ` WHERE (a.taluk IS NULL OR LOWER(TRIM(a.taluk)) = LOWER(TRIM(?)))`;
        params.push(taluk);
      }
      
      query += ` ORDER BY a.is_permanent DESC, a.created_at DESC`;

      const [announcements] = await connection.execute(query, params);

      return {
        success: true,
        data: announcements
      };
    } finally {
      connection.release();
    }
  }

  static async createAnnouncement({ title, content, isPermanent, expiresAt, createdBy, district, taluk }) {
    const connection = await pool.getConnection();
    try {
      if (!isPermanent && !expiresAt) {
        throw { statusCode: 400, message: 'Expiry date is required unless the update is permanent' };
      }

      if (!isPermanent) {
        const expiryDate = new Date(expiresAt);
        if (Number.isNaN(expiryDate.getTime())) {
          throw { statusCode: 400, message: 'Please provide a valid expiry date' };
        }
        if (expiryDate <= new Date()) {
          throw { statusCode: 400, message: 'Expiry date must be in the future' };
        }
      }

      const [result] = await connection.execute(
        `INSERT INTO announcements (title, content, is_permanent, expires_at, created_by, district, taluk)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [title, content, isPermanent ? 1 : 0, isPermanent ? null : expiresAt, createdBy, district || null, taluk ? taluk.trim() : null]
      );

      const [rows] = await connection.execute(
        `SELECT id, title, content, is_permanent, expires_at, created_at, district, taluk
         FROM announcements
         WHERE id = ?`,
        [result.insertId]
      );

      const announcement = rows[0];

      // Get recipients based on taluk
      let recipientQuery = `SELECT id, name, email, taluk
         FROM users
         WHERE is_active = 1 AND is_verified = 1 AND email IS NOT NULL AND email != ''`;
      
      if (taluk) {
        // Normalize taluk match for recipients as well
        recipientQuery += ` AND LOWER(TRIM(taluk)) = LOWER(TRIM(?))`;
      }

      const [recipients] = await connection.execute(recipientQuery, taluk ? [taluk] : []);

      await Promise.allSettled(
        recipients.map((recipient) =>
          NotificationService.createNotification(
            recipient.id,
            null,
            `Municipality Update: ${announcement.title}`,
            content,
            'system'
          )
        )
      );

      await Promise.allSettled(
        recipients.map((recipient) =>
          sendMunicipalityUpdateEmail(recipient.email, recipient.name, announcement)
        )
      );

      return {
        success: true,
        message: 'Municipality update published successfully',
        data: announcement
      };
    } finally {
      connection.release();
    }
  }

  static async deleteAnnouncement(id) {
    const connection = await pool.getConnection();
    try {
      const [existing] = await connection.execute(
        'SELECT id FROM announcements WHERE id = ?',
        [id]
      );

      if (existing.length === 0) {
        throw { statusCode: 404, message: 'Update not found' };
      }

      await connection.execute('DELETE FROM announcements WHERE id = ?', [id]);

      return {
        success: true,
        message: 'Update deleted successfully'
      };
    } finally {
      connection.release();
    }
  }
}

module.exports = AnnouncementService;
