-- ============================================
-- Smart Civic Communication Database Schema
-- ============================================

-- Create Database
CREATE DATABASE IF NOT EXISTS civic_app_db;
USE civic_app_db;

-- ============================================
-- Users Table - Citizens and Admins
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(15) UNIQUE NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  district VARCHAR(100),
  taluk VARCHAR(100),
  role ENUM('citizen', 'admin') DEFAULT 'citizen',
  password_hash VARCHAR(255),
  otp VARCHAR(10),
  otp_expires_at TIMESTAMP NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone (phone),
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_district (district),
  INDEX idx_taluk (taluk),
  INDEX idx_created_at (created_at)
);

-- ============================================
-- Complaints Table
-- ============================================
CREATE TABLE IF NOT EXISTS complaints (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tracking_id VARCHAR(50),
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
  status ENUM('pending', 'in_progress', 'resolved', 'closed') DEFAULT 'pending',
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
  INDEX idx_priority (priority),
  INDEX idx_category (category),
  INDEX idx_district (district),
  INDEX idx_taluk (taluk),
  INDEX idx_created_at (created_at),
  INDEX idx_latitude (latitude),
  INDEX idx_longitude (longitude)
);

-- ============================================
-- Notifications Table
-- ============================================
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
  INDEX idx_complaint_id (complaint_id),
  INDEX idx_created_at (created_at),
  INDEX idx_is_read (is_read)
);

-- ============================================
-- Activity Logs Table
-- ============================================
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
  INDEX idx_complaint_id (complaint_id),
  INDEX idx_action_by (action_by),
  INDEX idx_created_at (created_at)
);

-- ============================================
-- Announcements Table
-- ============================================
CREATE TABLE IF NOT EXISTS announcements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  content LONGTEXT NOT NULL,
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
  INDEX idx_created_at (created_at),
  INDEX idx_is_permanent (is_permanent),
  INDEX idx_expires_at (expires_at)
);

-- ============================================
-- Dashboard Stats Cache Table
-- ============================================
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_stat_date (stat_date)
);

-- ============================================
-- Insert Sample Data (Optional - for testing)
-- ============================================

-- Sample Admin User (Email: admin@example.com, Password: password)
INSERT INTO users (name, email, phone, role, password_hash, is_verified, is_active, district, taluk)
VALUES (
  'Administrator',
  'admin@example.com',
  '9999999999',
  'admin',
  '$2a$10$YixLn1sJDd8UwCG9Jcn0bOIQgMSt7w8gHcC0DbCw8aH8gKiKLUV2m',
  TRUE,
  TRUE,
  'Chennai',
  'Alandur'
);

-- Sample Citizen Users
INSERT INTO users (name, phone, address, latitude, longitude, role, is_verified, is_active, district, taluk)
VALUES
  ('Ramesh Kumar', '9876543210', 'Anna Nagar, Chennai', '13.161389', '80.209090', 'citizen', TRUE, TRUE, 'Chennai', 'Alandur'),
  ('Priya Sharma', '9876543211', 'T. Nagar, Chennai', '13.034722', '80.234722', 'citizen', TRUE, TRUE, 'Chennai', 'Egmore'),
  ('Arun Singh', '9876543212', 'Velachery, Chennai', '12.970833', '80.217778', 'citizen', TRUE, TRUE, 'Chennai', 'Velachery');

-- Sample Complaints
INSERT INTO complaints (tracking_id, user_id, title, description, category, latitude, longitude, address, status, priority, district, taluk)
VALUES
  ('202604041200000-001', 2, 'Large Pothole on Main Street', 'There is a dangerous pothole near the main intersection', 'pothole', '13.161389', '80.209090', 'Anna Nagar, Chennai', 'pending', 'high', 'Chennai', 'Alandur'),
  ('202604041200001-002', 3, 'Street Light Not Working', 'The street light near the park is broken for 2 weeks', 'streetlight', '13.034722', '80.234722', 'T. Nagar, Chennai', 'in_progress', 'medium', 'Chennai', 'Egmore'),
  ('202604041200002-003', 4, 'Water Pipeline Leakage', 'Water is leaking from the pipeline near the school', 'water', '12.970833', '80.217778', 'Velachery, Chennai', 'resolved', 'high', 'Chennai', 'Velachery');

-- ============================================
-- Create Views for Common Queries
-- ============================================

-- View: Open Complaints
CREATE OR REPLACE VIEW open_complaints AS
SELECT 
  c.id,
  c.title,
  c.description,
  c.category,
  c.status,
  c.priority,
  c.created_at,
  u.name as submitted_by
FROM complaints c
JOIN users u ON c.user_id = u.id
WHERE c.status IN ('pending', 'in_progress')
ORDER BY c.priority DESC, c.created_at ASC;

-- View: Complaint Statistics by Category
CREATE OR REPLACE VIEW complaint_stats_by_category AS
SELECT 
  category,
  COUNT(*) as total_complaints,
  SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
  ROUND(AVG(TIMESTAMPDIFF(DAY, created_at, resolved_at)), 2) as avg_resolution_days
FROM complaints
GROUP BY category;
