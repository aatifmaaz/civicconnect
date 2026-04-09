/**
 * Admin Service
 * Handles admin operations and dashboard
 */

const { pool } = require('../config/database');

class AdminService {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats() {
    const connection = await pool.getConnection();
    try {
      // Get complaint statistics
      const [stats] = await connection.execute(
        `SELECT 
          COUNT(*) as total_complaints,
          SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_complaints,
          SUM(CASE WHEN status = 'Verified' THEN 1 ELSE 0 END) as verified_complaints,
          SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_complaints,
          SUM(CASE WHEN status = 'On Hold' THEN 1 ELSE 0 END) as on_hold_complaints,
          SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_complaints,
          SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed_complaints,
          SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected_complaints,
          SUM(CASE WHEN priority = 'critical' THEN 1 ELSE 0 END) as critical_complaints
         FROM complaints`
      );

      // Get user statistics
      const [userStats] = await connection.execute(
        `SELECT 
          COUNT(*) as total_users,
          SUM(CASE WHEN role = 'citizen' THEN 1 ELSE 0 END) as total_citizens,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as total_admins
         FROM users`
      );

      // Get category statistics
      const [categoryStats] = await connection.execute(
        `SELECT category, COUNT(*) as count
         FROM complaints
         GROUP BY category
         ORDER BY count DESC`
      );

      // Get status distribution
      const [statusStats] = await connection.execute(
        `SELECT status, COUNT(*) as count
         FROM complaints
         GROUP BY status`
      );

      // Get priority distribution
      const [priorityStats] = await connection.execute(
        `SELECT priority, COUNT(*) as count
         FROM complaints
         GROUP BY priority`
      );

      const [resolutionStats] = await connection.execute(
        `SELECT AVG(TIMESTAMPDIFF(DAY, created_at, resolved_at)) as avg_resolution_days
         FROM complaints
         WHERE resolved_at IS NOT NULL`
      );

      // Get recent complaints (last 5)
      const [recentComplaints] = await connection.execute(
        `SELECT c.id, c.title, c.status, c.priority, c.created_at, u.name
         FROM complaints c
         LEFT JOIN users u ON c.user_id = u.id
         ORDER BY c.created_at DESC
         LIMIT 5`
      );

      return {
        success: true,
        stats: {
          overall: stats[0],
          users: userStats[0],
          categories: categoryStats,
          statusDistribution: statusStats,
          priorityDistribution: priorityStats,
          resolutionTime: resolutionStats[0]
        },
        recentComplaints,
        timestamp: new Date()
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all users
   */
  static async getAllUsers(page = 1, limit = 20) {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * limit;

      // Get total count
      const [countResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM users'
      );

      // Get paginated users
      const parsedLimit = Number(limit) || 10;
      const parsedOffset = Number(offset) || 0;
      const [users] = await connection.execute(
        `SELECT id, name, email, phone, role, district, taluk, is_active, created_at
         FROM users
         ORDER BY created_at DESC
         LIMIT ${parsedLimit} OFFSET ${parsedOffset}`
      );

      return {
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Assign a district and taluk to an admin user (super admin only)
   */
  static async assignTalukToAdmin(adminId, district, taluk) {
    const connection = await pool.getConnection();
    try {
      const [users] = await connection.execute('SELECT id, role FROM users WHERE id = ?', [adminId]);
      if (users.length === 0) throw { statusCode: 404, message: 'User not found' };
      if (users[0].role !== 'admin') throw { statusCode: 400, message: 'Only admin users can be assigned a taluk' };

      await connection.execute(
        'UPDATE users SET district = ?, taluk = ? WHERE id = ?',
        [district, taluk, adminId]
      );

      return { success: true, message: `Admin assigned to ${taluk}, ${district}` };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Deactivate user account
   */
  static async deactivateUser(userId) {
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        'UPDATE users SET is_active = 0 WHERE id = ?',
        [userId]
      );

      return {
        success: true,
        message: 'User account deactivated'
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Activate user account
   */
  static async activateUser(userId) {
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        'UPDATE users SET is_active = 1 WHERE id = ?',
        [userId]
      );

      return {
        success: true,
        message: 'User account activated'
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Delete user account permanently
   * Cleans up all related records first to respect FK constraints,
   * then removes the user row.
   */
  static async deleteUser(userId) {
    const connection = await pool.getConnection();
    try {
      // Confirm user exists and is not an admin
      const [users] = await connection.execute(
        'SELECT id, name, role FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
      }

      if (users[0].role === 'admin') {
        const err = new Error('Cannot delete an admin account');
        err.status = 403;
        throw err;
      }

      // 1. Delete activity_logs for this user's complaints
      //    (activity_logs → complaints, must go before deleting complaints)
      await connection.execute(
        `DELETE al FROM activity_logs al
         INNER JOIN complaints c ON al.complaint_id = c.id
         WHERE c.user_id = ?`,
        [userId]
      );

      // 2. Delete activity_logs where user was the actor
      await connection.execute(
        'DELETE FROM activity_logs WHERE action_by = ?',
        [userId]
      );

      // 3. Delete notifications belonging to this user
      await connection.execute(
        'DELETE FROM notifications WHERE user_id = ?',
        [userId]
      );

      // 4. Delete complaints (notifications with complaint_id FK are already gone)
      await connection.execute(
        'DELETE FROM complaints WHERE user_id = ?',
        [userId]
      );

      // 5. Finally delete the user
      await connection.execute(
        'DELETE FROM users WHERE id = ?',
        [userId]
      );

      return {
        success: true,
        message: 'User and all associated data have been permanently deleted'
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get complaints by location (nearby)
   */
  static async getComplaintsByLocation(latitude, longitude, radius = 5) {
    const connection = await pool.getConnection();
    try {
      // Using Haversine formula simplified for MySQL
      const [complaints] = await connection.execute(
        `SELECT c.*, u.name, u.phone,
                (3959 * ACOS(COS(RADIANS(?)) * COS(RADIANS(latitude)) * 
                COS(RADIANS(longitude) - RADIANS(?)) + 
                SIN(RADIANS(?)) * SIN(RADIANS(latitude)))) AS distance
         FROM complaints c
         LEFT JOIN users u ON c.user_id = u.id
         HAVING distance < ?
         ORDER BY distance ASC`,
        [latitude, longitude, latitude, radius]
      );

      return {
        success: true,
        data: complaints
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Export complaints data
   */
  static async exportComplaints(format = 'json', filters = {}) {
    const connection = await pool.getConnection();
    try {
      // Build query with filters
      let query = 'SELECT c.*, u.name, u.phone FROM complaints c LEFT JOIN users u ON c.user_id = u.id WHERE 1=1';
      let params = [];

      if (filters.status) {
        query += ' AND c.status = ?';
        params.push(filters.status);
      }

      if (filters.startDate && filters.endDate) {
        query += ' AND c.created_at BETWEEN ? AND ?';
        params.push(filters.startDate, filters.endDate);
      }

      const [complaints] = await connection.execute(query, params);

      return {
        success: true,
        data: complaints,
        format: format,
        count: complaints.length
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = AdminService;
