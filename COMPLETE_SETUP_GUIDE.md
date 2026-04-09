# Smart Civic Communication & Issue Management System - Complete Setup Guide

## 📋 Table of Contents
1. [Project Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Database Setup](#database-setup)
6. [API Endpoints](#api-endpoints)
7. [Deployment](#deployment)

---

## Overview

The **Smart Civic Communication & Issue Management System for Tamil Nadu** is a comprehensive civic-tech platform that enables citizens to report local issues to municipality authorities and allows administrators to track, prioritize, and resolve complaints efficiently.

### Key Features:
- ✅ OTP-based authentication (SMS via mock service)
- ✅ Complaint submission with image uploads
- ✅ GPS-based location tracking
- ✅ Real-time status updates and notifications
- ✅ Admin dashboard with analytics and charts
- ✅ 3D visualization with Three.js
- ✅ Responsive modern UI with Tailwind CSS
- ✅ Production-ready backend API

---

## prerequisites

### Required Software:
- **Node.js** v16+ ([Download](https://nodejs.org/))
- **MySQL** 5.7+ ([Download](https://www.mysql.com/))
- **Git** ([Download](https://git-scm.com/))
- **npm** or **yarn** (comes with Node.js)

### Recommended Tools:
- **Postman** - For API testing
- **MySQL Workbench** - For database management
- **VS Code** - For code editing

### System Requirements:
- RAM: 4GB minimum (8GB recommended)
- Storage: 2GB minimum for development
- OS: Windows, macOS, or Linux

---

## Backend Setup

### Step 1: Install Dependencies

```bash
cd civic-app/backend
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the backend folder (copy from `.env.example`):

```env
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=civic_app_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=7d

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# API
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Step 3: Create MySQL Database

**Option A: Using MySQL CLI:**
```bash
mysql -u root -p
CREATE DATABASE civic_app_db;
USE civic_app_db;
```

**Option B: Using MySQL Workbench:**
1. Open MySQL Workbench
2. Right-click on "Schemas" → Select "Create Schema"
3. Name it "civic_app_db"
4. Click "Apply"

### Step 4: Run Database Schema

```bash
# The schema will be auto-created when the server starts
# OR manually run:

mysql -u root -p < database/schema.sql
```

### Step 5: Start Backend Server

```bash
npm run dev
```

Expected output:
```
✓ Database connected successfully
✓ Server running on port 5000
✓ Environment: development
```

### Testing Backend:
```bash
# Health check
curl http://localhost:5000/api/health

# Response:
# {"status":"Server is running"}
```

---

## Frontend Setup

### Step 1: Install Dependencies

```bash
cd civic-app/frontend
npm install
```

### Step 2: Create .env.local file

Create `.env.local` in the frontend folder:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Step 3: Start Development Server

```bash
npm run dev
```

Expected output:
```
> Ready in 2.3s
> Local: http://localhost:3000
```

### Access the Application:
- **Home**: http://localhost:3000
- **Register**: http://localhost:3000/register
- **Login**: http://localhost:3000/login
- **Admin**: http://localhost:3000/admin/dashboard

---

## Database Setup

### Schema Overview

The application uses the following tables:

#### `users`
- Stores citizen and admin information
- Fields: id, name, email, phone, address, latitude, longitude, role, password_hash, otp, otp_expires_at, is_verified, is_active, created_at, updated_at

#### `complaints`
- Stores all reported complaints
- Fields: id, user_id, title, description, category, image_url, latitude, longitude, address, status, priority, assigned_to, resolution_notes, created_at, updated_at, resolved_at

#### `notifications`
- Stores user notifications
- Fields: id, user_id, complaint_id, title, message, type, is_read, created_at

#### `activity_logs`
- Tracks status updates and actions
- Fields: id, complaint_id, action_by, action, old_status, new_status, notes, created_at

### Complaint Categories:
- `pothole` - Road defects
- `streetlight` - Lighting issues
- `water` - Water supply problems
- `electricity` - Power issues
- `cleanliness` - Sanitation
- `other` - Other issues

### Status Values:
- `pending` - Newly registered
- `in_progress` - Being investigated
- `resolved` - Issue fixed
- `closed` - Complaint closed

### Priority Levels:
- `low` - Non-urgent
- `medium` - Standard priority
- `high` - Urgent
- `critical` - Emergency

---

## API Endpoints

### Authentication Endpoints

#### Register (Request OTP)
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "9876543210",
  "email": "john@example.com",
  "address": "123 Main St, Tamil Nadu"
}

Response:
{
  "success": true,
  "message": "OTP sent to your phone",
  "phone": "9876543210"
}
```

#### Verify OTP & Register
```
POST /api/auth/verify-register
Content-Type: application/json

{
  "phone": "9876543210",
  "otp": "123456",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123"
}

Response:
{
  "success": true,
  "user": { ... },
  "accessToken": "jwt_token_here",
  "refreshToken": "refresh_token_here"
}
```

#### Login (Request OTP)
```
POST /api/auth/login-request
Content-Type: application/json

{
  "phone": "9876543210"
}

Response:
{
  "success": true,
  "message": "OTP sent to your phone",
  "phone": "9876543210"
}
```

#### Verify OTP & Login
```
POST /api/auth/login-verify
Content-Type: application/json

{
  "phone": "9876543210",
  "otp": "123456"
}

Response:
{
  "success": true,
  "user": { ... },
  "accessToken": "jwt_token_here"
}
```

#### Get Profile
```
GET /api/auth/profile
Authorization: Bearer {accessToken}

Response:
{
  "success": true,
  "user": { ... }
}
```

### Complaint Endpoints

#### Submit Complaint
```
POST /api/complaints/create
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

Fields:
- title (string): Complaint title
- description (string): Detailed description
- category (string): Category of complaint
- latitude (number): Location latitude
- longitude (number): Location longitude
- address (string): Location address
- image (file): Image file

Response:
{
  "success": true,
  "message": "Complaint registered successfully",
  "complaintId": 123
}
```

#### Get My Complaints
```
GET /api/complaints/my-complaints?page=1&limit=10&status=pending
Authorization: Bearer {accessToken}

Response:
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

#### Get Complaint Details
```
GET /api/complaints/{complaintId}
Authorization: Bearer {accessToken}

Response:
{
  "success": true,
  "complaint": { ... }
}
```

### Admin Endpoints

#### Dashboard Stats
```
GET /api/admin/dashboard
Authorization: Bearer {adminToken}

Response:
{
  "success": true,
  "complaints": { ... },
  "users": { ... },
  "statistics": { ... }
}
```

#### Get All Complaints
```
GET /api/admin/complaints?page=1&status=pending
Authorization: Bearer {adminToken}

Response:
{
  "success": true,
  "data": [...],
  "pagination": { ... }
}
```

#### Update Complaint Status
```
PUT /api/admin/complaints/{complaintId}/status
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "status": "in_progress",
  "notes": "Investigating the issue"
}

Response:
{
  "success": true,
  "message": "Complaint status updated successfully"
}
```

#### Assign Complaint
```
POST /api/admin/complaints/{complaintId}/assign
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "adminId": 5
}

Response:
{
  "success": true,
  "message": "Complaint assigned successfully"
}
```

### Notification Endpoints

#### Get Notifications
```
GET /api/notifications?page=1&limit=20
Authorization: Bearer {accessToken}

Response:
{
  "success": true,
  "notifications": [...],
  "pagination": { ... }
}
```

#### Get Unread Count
```
GET /api/notifications/unread
Authorization: Bearer {accessToken}

Response:
{
  "success": true,
  "unread": 5
}
```

#### Mark as Read
```
PUT /api/notifications/{notificationId}/read
Authorization: Bearer {accessToken}

Response:
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

## Development Tips

### Testing OTP Functionality:
In development mode, all OTP endpoints return a fixed OTP: **123456**

This is configured in `backend/src/utils/otp.js`:
```javascript
const getMockOTP = (phone) => {
  return '123456'; // Use for testing
};
```

### Test Credentials:
```
Phone: 9876543210
OTP: 123456
Password: Test@123
```

### API Testing with Postman:
1. Import the Postman collection from `docs/POSTMAN_COLLECTION.json`
2. Set variables:
   - `baseUrl`: http://localhost:5000/api
   - `accessToken`: (Auto-set after login)
3. Test endpoints in sequence

---

## Deployment

### Frontend Deployment (Vercel)
```bash
cd civic-app/frontend
npm run build
vercel deploy
```

### Backend Deployment (Heroku)
```bash
cd civic-app/backend
heroku create civic-app-backend
git push heroku main
```

### Database Deployment (AWS RDS)
1. Create RDS MySQL instance
2. Update DB credentials in .env
3. Run schema migration

---

## Troubleshooting

### Issue: Database Connection Failed
**Solution:**
1. Check MySQL is running: `mysql -u root -p -e "SELECT 1"`
2. Verify credentials in .env
3. Create database: `CREATE DATABASE civic_app_db;`

### Issue: Port Already in Use
**Solution:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

### Issue: Module Not Found
**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## Support & Documentation

- **API Documentation**: See `docs/API.md`
- **Architecture**: See `docs/ARCHITECTURE.md`
- **Contributing**: See `CONTRIBUTING.md`
- **Issues**: Create an issue on GitHub

---

**Happy Coding! 🚀**
