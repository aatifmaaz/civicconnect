# Setup Instructions

Complete step-by-step setup guide for the Civic Hub application.

## System Requirements

- **Node.js:** 16.0 or higher
- **npm:** 7.0 or higher  
- **MySQL:** 8.0 or higher
- **Git:** (for cloning/version control)
- **RAM:** Minimum 2GB
- **Storage:** 500MB free space

## Pre-Setup Checklist

- [ ] Node.js and npm installed
- [ ] MySQL installed and running
- [ ] Git installed
- [ ] Text editor/IDE (VS Code recommended)
- [ ] At least 500MB free disk space

---

## Phase 1: Database Setup

### Step 1: Create MySQL Database

1. **Open MySQL command line or client:**
   ```bash
   mysql -u root -p
   ```

2. **Create database:**
   ```sql
   CREATE DATABASE civic_app_db;
   USE civic_app_db;
   ```

3. **Import schema:**
   ```bash
   mysql -u root -p civic_app_db < database/schema.sql
   ```

4. **Verify tables created:**
   ```sql
   SHOW TABLES;
   ```

You should see: `users`, `complaints`, `notifications`, `activity_logs`, `dashboard_stats`

### Step 2: Verify Sample Data

```sql
SELECT * FROM users;
-- Should show admin user and 3 sample citizens
```

**Default Admin Credentials:**
- Email: `admin@example.com`
- Password: `password`
- Phone: `9999999999`

---

## Phase 2: Backend Setup

### Step 1: Navigate to Backend Directory

```bash
cd civic-app/backend
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install:
- express
- mysql2
- dotenv
- bcryptjs
- jsonwebtoken
- multer
- axios
- And other required packages

### Step 3: Create Environment File

Copy the example file:
```bash
cp .env.example .env
```

### Step 4: Configure Environment Variables

Edit `.env` file with your database credentials:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=civic_app_db
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRY=7d

# OTP Configuration
OTP_LENGTH=6
OTP_EXPIRY=5

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

**Important:** 
- Replace `your_mysql_password` with your actual MySQL root password
- Change `JWT_SECRET` to a random string for production
- Keep `CORS_ORIGIN` as `http://localhost:3000` for local development

### Step 5: Start Backend Server

```bash
npm run dev
```

**Expected Output:**
```
✓ Database connected successfully
✓ Server running on port 5000
✓ Environment: development
```

**Test Backend:**
```bash
curl http://localhost:5000/api/health
```

Response should be:
```json
{"status": "Server is running"}
```

---

## Phase 3: Frontend Setup

### Step 1: Navigate to Frontend Directory

```bash
cd civic-app/frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install:
- next
- react
- tailwindcss
- axios
- chart.js
- And other required packages

### Step 3: Configure Environment Variables

The `.env.local` file should already exist with default values:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=mock_api_key
NEXT_PUBLIC_ENV=development
```

No changes needed for local development, but you can customize as needed.

### Step 4: Start Frontend Development Server

```bash
npm run dev
```

**Expected Output:**
```
ready - started server on 0.0.0.0:3000
```

**Access Application:**
Open browser and go to: `http://localhost:3000`

---

## Phase 4: Testing the Application

### Test 1: Citizen Registration

1. Go to `http://localhost:3000/register`
2. Enter the following details:
   - Name: "Test User"
   - Phone: "9876543210"
   - Email: "test@example.com"
   - Address: "Test Area"
3. Click "Send OTP"
4. Enter OTP: `123456` (mocked)
5. Click "Verify OTP"
6. Should redirect to dashboard

### Test 2: Admin Login

1. Go to `http://localhost:3000/login`
2. Select "Admin" tab
3. Enter credentials:
   - Email: `admin@example.com`
   - Password: `password`
4. Should redirect to admin dashboard

### Test 3: Submit Complaint

1. Login as citizen
2. Go to "Submit Complaint"
3. Fill form:
   - Title: "Test Pothole"
   - Description: "Test complaint description"
   - Category: "pothole"
   - Click "Use Current Location" or enter manually
   - Optional: Upload image
4. Click "Submit Complaint"
5. Check dashboard for submitted complaint

### Test 4: Admin Management

1. Login as admin
2. Go to Admin Dashboard
3. View statistics
4. Go to "All Complaints"
5. Click "Update" on any complaint
6. Change status and add notes
7. Click "Update"

### Test 5: Notifications

1. Login as citizen
2. Go to "Notifications"
3. Should see notifications from status changes

---

## Troubleshooting

### Issue: Database Connection Failed

**Solution:**
1. Check MySQL is running: `mysql -u root -p`
2. Verify credentials in `.env` file
3. Ensure database `civic_app_db` exists: `SHOW DATABASES;`

### Issue: Port 5000 Already in Use

**Solution:**
```bash
# Change PORT in .env to 5001
# Or kill the process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :5000
kill -9 <PID>
```

### Issue: Port 3000 Already in Use

**Solution:**
```bash
# Change port in frontend startup:
npm run dev -- -p 3001
```

### Issue: CORS Error

**Solution:**
Ensure `CORS_ORIGIN` in backend `.env` matches frontend URL:
```env
CORS_ORIGIN=http://localhost:3000
```

### Issue: Image Upload Not Working

**Solution:**
1. Check `/uploads` directory exists in backend
2. Verify `UPLOAD_DIR` in `.env`
3. Check file size (max 5MB)
4. Verify file type (image only)

### Issue: OTP Not Received

**Solution:**
- OTP is mocked for development
- Check console logs for OTP value
- Default mock OTP: `123456`

---

## Project File Structure Reference

```
civic-app/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── complaintController.js
│   │   │   ├── adminController.js
│   │   │   └── notificationController.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── complaintRoutes.js
│   │   │   ├── adminRoutes.js
│   │   │   └── notificationRoutes.js
│   │   ├── services/ (Business logic)
│   │   ├── middleware/ (Auth, validation, errors)
│   │   ├── utils/ (Helpers, JWT, OTP, File upload)
│   │   ├── config/ (Database config)
│   │   └── server.js (Entry point)
│   ├── uploads/ (File storage)
│   ├── .env
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── _app.js
│   │   │   ├── index.js (Home)
│   │   │   ├── register.js
│   │   │   ├── login.js
│   │   │   ├── dashboard.js (Citizen)
│   │   │   ├── notifications.js
│   │   │   ├── complaint/
│   │   │   │   ├── submit.js
│   │   │   │   └── [id].js
│   │   │   └── admin/
│   │   │       ├── dashboard.js
│   │   │       └── complaints.js
│   │   ├── components/ (Reusable)
│   │   ├── services/
│   │   │   └── api.js (API calls)
│   │   ├── context/
│   │   │   └── AuthContext.js (Auth state)
│   │   ├── styles/
│   │   │   └── globals.css
│   │   └── utils/
│   │       └── helpers.js (Utilities)
│   ├── public/
│   ├── .env.local
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── database/
│   └── schema.sql
│
├── docs/
│   ├── API.md
│   ├── SETUP.md (This file)
│   └── README.md
│
└── README.md
```

---

## Development Commands

### Backend

```bash
# Install dependencies
npm install

# Start development (with auto-reload)
npm run dev

# Start production
npm start

# Run tests (when added)
npm test
```

### Frontend

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build

# Start production build
npm start

# Lint code
npm run lint
```

---

## Database Entities

### Users Table
- Stores both citizens and admins
- Phone is unique identifier
- Hashed passwords for admins
- Verified status for citizens

### Complaints Table
- Main data table
- Links to users (citizen who submitted)
- Tracks status, priority, category
- Stores image URLs and location

### Notifications Table
- Tracks all notifications for users
- Links to complaints
- Read/unread status

### Activity Logs Table
- Tracks all changes to complaints
- Shows status transitions
- Records admin actions

---

## Production Deployment

### Backend (Heroku)

```bash
# Install Heroku CLI
# Login
heroku login

# Create app
heroku create your-app-name

# Add config vars
heroku config:set DB_HOST=your_rds_host
heroku config:set DB_PASSWORD=your_password
heroku config:set JWT_SECRET=your_production_secret

# Deploy
git push heroku main
```

### Frontend (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# NEXT_PUBLIC_API_URL=https://your-backend.herokuapp.com/api
```

### Database (AWS RDS)

1. Create MySQL RDS instance
2. Update DB_HOST in backend .env
3. Run schema.sql on RDS database

---

## Security Checklist

- [ ] Change JWT_SECRET in production
- [ ] Use HTTPS in production
- [ ] Set strong database password
- [ ] Enable CORS only for your domain
- [ ] Add rate limiting
- [ ] Add input sanitization
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS on backend
- [ ] Regular database backups
- [ ] Monitor error logs

---

## Support & Debugging

### Enable Debug Logs

1. In backend `.env`:
   ```env
   NODE_ENV=development
   ```

2. Check console output for detailed error messages

### Common Ports

- Backend: 5000
- Frontend: 3000
- MySQL: 3306

### File Locations

- Backend: `civic-app/backend/`
- Frontend: `civic-app/frontend/`
- Database: Local/Cloud MySQL
- Uploads: `civic-app/backend/uploads/`

---

**Setup Complete! 🎉**

Your application is now ready for development. Visit `http://localhost:3000` to start using it.

For API documentation, see [API.md](./API.md)  
For general information, see [README.md](../README.md)
