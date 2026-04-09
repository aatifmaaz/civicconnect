/**
 * Database Configuration and Connection
 * Establishes MySQL connection and creates tables if they don't exist
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'civic_app_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * Initialize Database
 * Create database if not exists and create all required tables
 */
const initializeDatabase = async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    // Create database if not exists
    await connection.execute(`
      CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'civic_app_db'}
    `);

    await connection.end();

    // Get a connection from the pool
    connection = await pool.getConnection();

    // Read SQL schema from file if it exists, or use inline schema
    const schema = `
      -- Users table for citizens
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE,
        phone VARCHAR(15) UNIQUE NOT NULL,
        address TEXT,
        district VARCHAR(100),
        taluk VARCHAR(100),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        role ENUM('citizen', 'admin') DEFAULT 'citizen',
        password_hash VARCHAR(255),
        otp VARCHAR(10),
        otp_expires_at TIMESTAMP NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_phone (phone),
        INDEX idx_role (role)
      );

      -- Complaints table
      CREATE TABLE IF NOT EXISTS complaints (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tracking_id VARCHAR(50) UNIQUE,
        user_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50),
        image_url VARCHAR(255),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        address TEXT,
        district VARCHAR(100),
        taluk VARCHAR(100),
        status ENUM('Pending', 'Verified', 'In Progress', 'On Hold', 'Resolved', 'Closed', 'Rejected') DEFAULT 'Pending',
        priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
        assigned_to INT,
        resolution_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      );

      -- Notifications table
      CREATE TABLE IF NOT EXISTS notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        complaint_id INT,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('status_update', 'new_assignment', 'system', 'alert') DEFAULT 'status_update',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      );

      -- Activity Log table
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        complaint_id INT NOT NULL,
        action_by INT NOT NULL,
        action VARCHAR(100) NOT NULL,
        old_status VARCHAR(50),
        new_status VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
        FOREIGN KEY (action_by) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_complaint_id (complaint_id)
      );

      -- Admin Dashboard Stats table (for caching)
      CREATE TABLE IF NOT EXISTS dashboard_stats (
        id INT PRIMARY KEY AUTO_INCREMENT,
        stat_date DATE UNIQUE,
        total_complaints INT DEFAULT 0,
        pending_complaints INT DEFAULT 0,
        in_progress_complaints INT DEFAULT 0,
        resolved_complaints INT DEFAULT 0,
        closed_complaints INT DEFAULT 0,
        total_users INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );

      -- Municipality announcements
      CREATE TABLE IF NOT EXISTS announcements (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        created_by INT NOT NULL,
        district VARCHAR(100),
        taluk VARCHAR(100),
        is_permanent BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_created_by (created_by),
        INDEX idx_district (district),
        INDEX idx_taluk (taluk),
        INDEX idx_announcements_expiry (expires_at),
        INDEX idx_announcements_created_at (created_at),
        INDEX idx_is_permanent (is_permanent)
      );
    `;

    // Execute schema
    const statements = schema.split(';').filter(stmt => stmt.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }

    // Ensure announcements table has the expected columns (for existing DBs)
    try {
      const [announcementCols] = await connection.execute("SHOW COLUMNS FROM announcements");
      const colNames = announcementCols.map(c => c.Field);

      if (!colNames.includes('district')) {
        await connection.execute("ALTER TABLE announcements ADD COLUMN district VARCHAR(100)");
        try { await connection.execute("CREATE INDEX idx_district (district)"); } catch (e) {}
      }

      if (!colNames.includes('taluk')) {
        await connection.execute("ALTER TABLE announcements ADD COLUMN taluk VARCHAR(100)");
        try { await connection.execute("CREATE INDEX idx_taluk (taluk)"); } catch (e) {}
      }

      if (!colNames.includes('is_permanent')) {
        await connection.execute("ALTER TABLE announcements ADD COLUMN is_permanent BOOLEAN DEFAULT FALSE");
        try { await connection.execute("CREATE INDEX idx_is_permanent (is_permanent)"); } catch (e) {}
      }
    } catch (e) {
      // If the announcements table does not exist yet or SHOW fails, ignore and continue
    }

    console.log('✓ Database tables initialized');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@civicconnect.local';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
    const adminName = process.env.ADMIN_NAME || 'System Admin';
    const adminPhone = process.env.ADMIN_PHONE || '9999999999';
    const adminAddress = process.env.ADMIN_ADDRESS || 'Municipal Command Center';
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const [existingAdmins] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [adminEmail]
    );

    if (existingAdmins.length === 0) {
      await connection.execute(
        `INSERT INTO users (name, email, phone, address, role, password_hash, is_verified, is_active)
         VALUES (?, ?, ?, ?, 'admin', ?, 1, 1)`,
        [adminName, adminEmail, adminPhone, adminAddress, passwordHash]
      );
      console.log(`Default admin account ensured for ${adminEmail}`);
    } else {
      await connection.execute(
        `UPDATE users
         SET name = ?, role = 'admin', password_hash = ?, is_verified = 1, is_active = 1
         WHERE email = ?`,
        [adminName, passwordHash, adminEmail]
      );
      console.log(`Default admin account refreshed for ${adminEmail}`);
    }

    connection.release();
    return pool;

  } catch (error) {
    throw new Error(`Database initialization failed: ${error.message}`);
  }
};

// Export pool for queries
module.exports = initializeDatabase;
module.exports.pool = pool;
