const { pool } = require('../config/database');
const { deleteFile } = require('../utils/fileUpload');
const { sendStatusUpdateEmail, sendComplaintConfirmationEmail, sendComplaintAssignmentEmail, sendAssignmentNotificationEmail } = require('../utils/sendEmail');

class ComplaintService {
  /**
   * Create new complaint
   * @param {number} userId - User ID
   * @param {string} title - Complaint title
   * @param {string} description - Complaint description
   * @param {string} category - Category of complaint
   * @param {string} imageUrl - Uploaded image URL
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @param {string} address - Location address
   * @param {string} priority - Priority level (default: medium)
   */
  static async createComplaint(userId, title, description, category, imageUrl, latitude, longitude, address, priority = 'medium', district = null, taluk = null) {
    const connection = await pool.getConnection();
    try {
      const now = new Date();
      const pad = (n, m = 2) => n.toString().padStart(m, '0');
      const trackingId = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${pad(now.getMilliseconds(), 3)}-${pad(Math.floor(Math.random() * 101), 3)}`;
      const normalizedParams = [
        trackingId,
        userId ?? null,
        title ?? null,
        description ?? null,
        category ?? null,
        imageUrl ?? null,
        latitude ?? null,
        longitude ?? null,
        address ?? null,
        district ?? null,
        taluk ?? null,
        priority ?? 'medium'
      ];

      const [result] = await connection.execute(
        `INSERT INTO complaints 
         (tracking_id, user_id, title, description, category, image_url, latitude, longitude, address, district, taluk, status, priority, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, NOW())`,
        normalizedParams
      );

      const complaintId = result.insertId;

      // Create notification for user
      await connection.execute(
        `INSERT INTO notifications (user_id, complaint_id, title, message, type) 
         VALUES (?, ?, 'Complaint Registered', 'Your complaint has been submitted successfully', 'status_update')`,
        [userId, complaintId]
      );

      // Create activity log
      await connection.execute(
        `INSERT INTO activity_logs (complaint_id, action_by, action, new_status) 
         VALUES (?, ?, 'created', 'Pending')`,
        [complaintId, userId]
      );

      // Send confirmation email to user
      const [userRows] = await connection.execute(
        'SELECT name, email FROM users WHERE id = ?',
        [userId]
      );

      if (userRows.length > 0 && userRows[0].email) {
        await sendComplaintConfirmationEmail(
          userRows[0].email,
          userRows[0].name,
          title,
          trackingId,
          address
        );
      }

      return {
        success: true,
        message: 'Complaint registered successfully',
        complaintId: complaintId,
        trackingId: trackingId
      };
    } catch (error) {
      // Delete uploaded file if insert fails
      if (imageUrl) {
        await deleteFile(imageUrl);
      }
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get complaint by ID
   * @param {number} complaintId - Complaint ID
   */
  static async getComplaintById(complaintId) {
    const connection = await pool.getConnection();
    try {
      const [complaints] = await connection.execute(
        `SELECT c.*, u.name, u.phone, u.email, u.address as user_address, 
                a.name as assigned_to_name 
         FROM complaints c 
         LEFT JOIN users u ON c.user_id = u.id 
         LEFT JOIN users a ON c.assigned_to = a.id 
         WHERE c.id = ?`,
        [complaintId]
      );

      if (complaints.length === 0) {
        throw {
          statusCode: 404,
          message: 'Complaint not found'
        };
      }

      return complaints[0];
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get complaints by user
   * @param {number} userId - User ID
   * @param {Object} filter - Filter criteria (status, category, etc.)
   * @param {number} page - Page number for pagination
   * @param {number} limit - Records per page
   */
  static async getComplaintsByUser(userId, filter = {}, page = 1, limit = 10) {
    const connection = await pool.getConnection();
    try {
      let query = 'SELECT * FROM complaints WHERE user_id = ?';
      let params = [userId];
      let countQuery = 'SELECT COUNT(*) as total FROM complaints WHERE user_id = ?';
      let countParams = [userId];

      // Apply filters
      if (filter.status) {
        query += ' AND status = ?';
        countQuery += ' AND status = ?';
        params.push(filter.status);
        countParams.push(filter.status);
      }

      if (filter.category) {
        query += ' AND category = ?';
        countQuery += ' AND category = ?';
        params.push(filter.category);
        countParams.push(filter.category);
      }

      if (filter.priority) {
        query += ' AND priority = ?';
        countQuery += ' AND priority = ?';
        params.push(filter.priority);
        countParams.push(filter.priority);
      }

      // Sort by created_at (newest first)
      query += ' ORDER BY created_at DESC';

      // Pagination
      const parsedLimit = Number(limit) || 10;
      const offset = (page - 1) * parsedLimit;
      query += ` LIMIT ${parsedLimit} OFFSET ${offset}`;

      // Get count
      const [countResult] = await connection.execute(countQuery, countParams);
      const total = countResult[0].total;

      // Get complaints
      const [complaints] = await connection.execute(query, params);

      return {
        success: true,
        data: complaints,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all complaints (for admin)
   * @param {Object} filter - Filter criteria
   * @param {number} page - Page number
   * @param {number} limit - Records per page
   */
  static async getAllComplaints(filter = {}, page = 1, limit = 20) {
    const connection = await pool.getConnection();
    try {
      let query = `SELECT c.*, u.name, u.phone, u.email 
                   FROM complaints c 
                   LEFT JOIN users u ON c.user_id = u.id 
                   WHERE 1=1`;
      let params = [];
      let countQuery = 'SELECT COUNT(*) as total FROM complaints c WHERE 1=1';
      let countParams = [];

      // Geo-Routing: If admin has a taluk assigned, show only their municipality's complaints
      if (filter.adminTaluk) {
        query += ' AND c.taluk = ?';
        countQuery += ' AND c.taluk = ?';
        params.push(filter.adminTaluk);
        countParams.push(filter.adminTaluk);
      }

      // Apply filters
      if (filter.status) {
        query += ' AND c.status = ?';
        countQuery += ' AND c.status = ?';
        params.push(filter.status);
        countParams.push(filter.status);
      }

      if (filter.category) {
        query += ' AND c.category = ?';
        countQuery += ' AND category = ?';
        params.push(filter.category);
        countParams.push(filter.category);
      }

      if (filter.priority) {
        query += ' AND c.priority = ?';
        countQuery += ' AND priority = ?';
        params.push(filter.priority);
        countParams.push(filter.priority);
      }

      if (filter.assignedTo !== undefined) {
        if (filter.assignedTo === null) {
          query += ' AND c.assigned_to IS NULL';
          countQuery += ' AND assigned_to IS NULL';
        } else {
          query += ' AND c.assigned_to = ?';
          countQuery += ' AND assigned_to = ?';
          params.push(filter.assignedTo);
          countParams.push(filter.assignedTo);
        }
      }

      // Search by title/description
      if (filter.search) {
        query += ' AND (c.title LIKE ? OR c.description LIKE ?)';
        countQuery += ' AND (title LIKE ? OR description LIKE ?)';
        const searchTerm = `%${filter.search}%`;
        params.push(searchTerm, searchTerm);
        countParams.push(searchTerm, searchTerm);
      }

      // Get total count
      const [countResult] = await connection.execute(countQuery, countParams);
      const total = countResult[0].total;
      // Sort by created_at (newest first)
      query += ' ORDER BY c.created_at DESC';

      // Pagination
      const parsedLimit = Number(limit) || 20;
      const offset = (page - 1) * parsedLimit;
      query += ` LIMIT ${parsedLimit} OFFSET ${offset}`;

      // Get complaints
      const [complaints] = await connection.execute(query, params);

      return {
        success: true,
        data: complaints,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Update complaint status
   * @param {number} complaintId - Complaint ID
   * @param {string} newStatus - New status
   * @param {number} adminId - Admin user ID
   * @param {string} notes - Resolution notes
   */
  static async updateComplaintStatus(complaintId, newStatus, adminId, notes = null) {
    const connection = await pool.getConnection();
    try {
      // Get complaint to find old status
      const [complaints] = await connection.execute(
        'SELECT * FROM complaints WHERE id = ?',
        [complaintId]
      );

      if (complaints.length === 0) {
        throw {
          statusCode: 404,
          message: 'Complaint not found'
        };
      }

      const oldStatus = complaints[0].status;
      const userId = complaints[0].user_id;

      const validTransitions = {
        'Pending': ['Verified', 'Rejected'],
        'Verified': ['In Progress', 'On Hold'],
        'In Progress': ['Resolved', 'On Hold'],
        'On Hold': ['In Progress'],
        'Resolved': ['Closed'],
        'Closed': [],
        'Rejected': []
      };

      if (!validTransitions[oldStatus] || !validTransitions[oldStatus].includes(newStatus)) {
        throw { statusCode: 400, message: `Invalid status transition from ${oldStatus} to ${newStatus}` };
      }

      // Update complaint
      const updateQuery = newStatus === 'Resolved' 
        ? 'UPDATE complaints SET status = ?, resolution_notes = ?, resolved_at = NOW() WHERE id = ?'
        : 'UPDATE complaints SET status = ?, resolution_notes = ? WHERE id = ?';

      const updateParams = newStatus === 'Resolved'
        ? [newStatus, notes, complaintId]
        : [newStatus, notes, complaintId];

      await connection.execute(updateQuery, updateParams);

      // Create activity log
      await connection.execute(
        `INSERT INTO activity_logs (complaint_id, action_by, action, old_status, new_status, notes) 
         VALUES (?, ?, 'status_update', ?, ?, ?)`,
        [complaintId, adminId, oldStatus, newStatus, notes]
      );

      // Create notification for user
      let message = `Your complaint status has been updated to ${newStatus}`;
      if (notes) message += `: ${notes}`;

      await connection.execute(
        `INSERT INTO notifications (user_id, complaint_id, title, message, type) 
         VALUES (?, ?, 'Status Update', ?, 'status_update')`,
        [userId, complaintId, message]
      );

      // Trigger Email Notification Phase 3
      const [userRows] = await connection.execute('SELECT name, email FROM users WHERE id = ?', [userId]);
      if (userRows.length > 0 && userRows[0].email) {
         await sendStatusUpdateEmail(userRows[0].email, userRows[0].name, complaints[0].title, newStatus, notes);
      }

      return {
        success: true,
        message: 'Complaint status updated successfully'
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Assign complaint to admin
   * @param {number} complaintId - Complaint ID
   * @param {number} adminId - Admin user ID
   * @param {number} assignedById - Admin who is assigning
   */
  static async assignComplaint(complaintId, adminId, assignedById) {
    const connection = await pool.getConnection();
    try {
      const [complaints] = await connection.execute(
        'SELECT * FROM complaints WHERE id = ?',
        [complaintId]
      );

      if (complaints.length === 0) {
        throw {
          statusCode: 404,
          message: 'Complaint not found'
        };
      }

      const complaint = complaints[0];

      // Update assignment
      await connection.execute(
        'UPDATE complaints SET assigned_to = ? WHERE id = ?',
        [adminId, complaintId]
      );

      // Create activity log
      await connection.execute(
        `INSERT INTO activity_logs (complaint_id, action_by, action, notes) 
         VALUES (?, ?, 'assigned', ?)`,
        [complaintId, assignedById, `Assigned to admin ID ${adminId}`]
      );

      // Create notification
      await connection.execute(
        `INSERT INTO notifications (user_id, complaint_id, title, message, type) 
         VALUES (?, ?, 'Complaint Assigned', 'Your complaint has been assigned to our team', 'new_assignment')`,
        [complaint.user_id, complaintId]
      );

      // Get admin and user details for email
      const [adminRows] = await connection.execute(
        'SELECT name, email FROM users WHERE id = ?',
        [adminId]
      );

      const [residentRows] = await connection.execute(
        'SELECT name, email FROM users WHERE id = ?',
        [complaint.user_id]
      );

      // Send email to assigned admin
      if (adminRows.length > 0 && adminRows[0].email) {
        await sendComplaintAssignmentEmail(
          adminRows[0].email,
          adminRows[0].name,
          complaint.title,
          complaint.tracking_id,
          {
            category: complaint.category,
            priority: complaint.priority,
            submitterName: residentRows.length > 0 ? residentRows[0].name : 'Unknown',
            address: complaint.address
          }
        );
      }

      // Send email to resident notifying assignment
      if (residentRows.length > 0 && residentRows[0].email) {
        await sendAssignmentNotificationEmail(
          residentRows[0].email,
          residentRows[0].name,
          complaint.title,
          complaint.tracking_id,
          adminRows.length > 0 ? adminRows[0].name : 'Municipal Team'
        );
      }

      return {
        success: true,
        message: 'Complaint assigned successfully'
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get activity logs for complaint
   * @param {number} complaintId - Complaint ID
   */
  static async getActivityLogs(complaintId) {
    const connection = await pool.getConnection();
    try {
      const [logs] = await connection.execute(
        `SELECT al.*, u.name as action_by_name 
         FROM activity_logs al 
         LEFT JOIN users u ON al.action_by = u.id 
         WHERE al.complaint_id = ? 
         ORDER BY al.created_at DESC`,
        [complaintId]
      );

      return {
        success: true,
        data: logs
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get complaint statistics
   * @param {Object} filter - Filter criteria
   */
  static async getStatistics(filter = {}) {
    const connection = await pool.getConnection();
    try {
      let whereClause = '';
      let params = [];

      if (filter.startDate && filter.endDate) {
        whereClause += ' WHERE created_at BETWEEN ? AND ?';
        params.push(filter.startDate, filter.endDate);
      }

      // Total complaints
      const [totalResult] = await connection.execute(
        `SELECT COUNT(*) as count FROM complaints${whereClause}`,
        params
      );

      // Complaints by status
      const [statusResult] = await connection.execute(
        `SELECT status, COUNT(*) as count FROM complaints${whereClause} GROUP BY status`,
        params
      );

      // Complaints by priority
      const [priorityResult] = await connection.execute(
        `SELECT priority, COUNT(*) as count FROM complaints${whereClause} GROUP BY priority`,
        params
      );

      // Complaints by category
      const [categoryResult] = await connection.execute(
        `SELECT category, COUNT(*) as count FROM complaints${whereClause} GROUP BY category`,
        params
      );

      return {
        success: true,
        total: totalResult[0].count,
        byStatus: statusResult,
        byPriority: priorityResult,
        byCategory: categoryResult
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Delete complaint (soft delete - archive)
   * @param {number} complaintId - Complaint ID
   */
  static async deleteComplaint(complaintId) {
    const connection = await pool.getConnection();
    try {
      const [complaints] = await connection.execute(
        'SELECT image_url FROM complaints WHERE id = ?',
        [complaintId]
      );

      if (complaints.length === 0) {
        throw {
          statusCode: 404,
          message: 'Complaint not found'
        };
      }

      // Delete image file
      if (complaints[0].image_url) {
        await deleteFile(complaints[0].image_url);
      }

      // Delete complaint
      await connection.execute(
        'DELETE FROM complaints WHERE id = ?',
        [complaintId]
      );

      return {
        success: true,
        message: 'Complaint deleted successfully'
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = ComplaintService;
