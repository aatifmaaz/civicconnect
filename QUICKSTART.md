# Quick Start Guide

Get the Civic Hub application running in 5 minutes!

## Prerequisites Check

Make sure you have:
- ✅ Node.js 16+ (`node --version`)
- ✅ MySQL 8.0+ (`mysql --version`)
- ✅ npm 7+ (`npm --version`)

## Step 1: Database (2 minutes)

```bash
# Connect to MySQL
mysql -u root -p

# In MySQL console:
CREATE DATABASE civic_app_db;
USE civic_app_db;
SOURCE civic-app/database/schema.sql;
EXIT;
```

## Step 2: Backend (1.5 minutes)

```bash
cd civic-app/backend

# Install packages
npm install

# Create and configure .env
cp .env.example .env
# Edit .env with your MySQL password

# Start server
npm run dev
```

✅ Backend runs on `http://localhost:5000`

## Step 3: Frontend (1.5 minutes)

```bash
cd ../frontend

# Install packages
npm install

# Start app
npm run dev
```

✅ App runs on `http://localhost:3000`

## Step 4: Test It!

### As Citizen:
1. Go to `http://localhost:3000/register`
2. Enter any name, phone: `9876543210`
3. Verify OTP: `123456`
4. Submit complaint with location

### As Admin:
1. Go to `http://localhost:3000/login`
2. Select "Admin" tab
3. Email: `admin@example.com`
4. Password: `password`
5. View dashboard and manage complaints

## 🎉 Done!

Your civic app is running!

## Troubleshooting

**Database error?**
```bash
mysql -u root -p < civic-app/database/schema.sql
```

**Port already in use?**
```bash
# Change PORT in backend/.env
# Or run frontend on different port:
npm run dev -- -p 3001
```

**API not connecting?**
- Check backend is running on port 5000
- Verify CORS_ORIGIN in .env matches frontend URL

##📚 Full Documentation

- [Setup Guide](../docs/SETUP.md)
- [API Documentation](../docs/API.md)
- [Architecture & Features](../README.md)

## Key Features Included

✅ Phone OTP Login  
✅ Complaint Submission  
✅ Image Upload  
✅ GPS Location  
✅ Real-time Notifications  
✅ Admin Dashboard  
✅ Statistics & Charts  
✅ Status Tracking  
✅ Full Authentication  

Enjoy! 🚀
