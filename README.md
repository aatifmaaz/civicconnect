# Smart Civic Communication & Issue Management System

## Project Overview

CivicHub is a comprehensive web application designed to facilitate seamless communication between citizens and municipal authorities in Tamil Nadu. The platform enables citizens to report civic issues and allows administrators to track, prioritize, and resolve complaints efficiently.

## 🎯 Key Features

### Citizens Module
- ✅ OTP-based Registration & Login
- ✅ Submit Complaints with Photo Evidence
- ✅ Location-based Issue Reporting (GPS Integration)
- ✅ Real-time Status Tracking
- ✅ Push Notifications for Updates
- ✅ Complaint History & Analytics
- ✅ View Complaint Details & Activity Timeline

### Admin Module
- ✅ Secure Admin Dashboard
- ✅ Real-time Statistics & Analytics
- ✅ Complaint Management Interface
- ✅ Status Update Management
- ✅ Category-wise Analytics
- ✅ Location-based Filtering
- ✅ Priority-based Assignment

## 🛠️ Technology Stack

**Frontend:**
- Next.js 14 (React Framework)
- Tailwind CSS (Styling)
- Three.js (3D Visualization)
- Chart.js (Data Visualization)
- Leaflet (Maps)
- Axios (HTTP Client)

**Backend:**
- Node.js with Express.js
- MySQL Database
- JWT Authentication
- Multer (File Upload)
- Joi (Data Validation)

**Deployment:**
- Can be deployed on Vercel (Frontend), Heroku/AWS (Backend), AWS RDS (Database)

## 📁 Project Structure

```
civic-app/
├── backend/
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── routes/             # API routes
│   │   ├── services/           # Business logic
│   │   ├── middleware/         # Auth, validation, error handling
│   │   ├── utils/              # Helper functions
│   │   ├── config/             # Database configuration
│   │   └── server.js           # Main server file
│   ├── uploads/                # File storage directory
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── pages/              # Next.js pages
│   │   ├── components/         # Reusable components
│   │   ├── services/           # API calls
│   │   ├── context/            # React Context (Auth)
│   │   ├── styles/             # CSS files
│   │   └── utils/              # Helper functions
│   ├── public/                 # Static assets
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── .env.local
│   └── README.md
│
├── database/
│   ├── schema.sql              # Database schema
│   └── sample-data.sql         # Sample data
│
└── docs/
    ├── API.md                  # API Documentation
    ├── SETUP.md                # Setup Instructions
    └── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm/yarn
- MySQL 8.0+
- Git

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd civic-app/backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create environment file:**
```bash
cp .env.example .env
```

4. **Configure .env file with your database credentials:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=civic_app_db
PORT=5000
JWT_SECRET=your_secret_key
```

5. **Start the backend server:**
```bash
npm run dev
```

Server will start on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd civic-app/frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm run dev
```

Frontend will be available on `http://localhost:3000`

## 🔐 Authentication

### Citizen Registration Flow
1. Enter phone number → Receive OTP via SMS (mocked)
2. Verify OTP → Get JWT Token
3. Access platform with token

### Admin Login
- Email: `admin@example.com`
- Password: `password`
- Role: `admin`

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register citizen
- `POST /api/auth/verify-otp` - Verify OTP and get token
- `POST /api/auth/admin-login` - Admin login
- `GET /api/auth/profile` - Get user profile (Protected)

### Complaints
- `POST /api/complaints/create` - Submit complaint (Citizen, Protected)
- `GET /api/complaints/my` - Get my complaints (Citizen, Protected)
- `GET /api/complaints/:id` - Get complaint details (Protected)
- `PUT /api/complaints/:id/status` - Update complaint status (Admin, Protected)
- `GET /api/complaints/search` - Search complaints with filters

### Notifications
- `GET /api/notifications` - Get notifications (Protected)
- `PUT /api/notifications/:id/read` - Mark as read (Protected)
- `PUT /api/notifications/mark-all-read` - Mark all as read (Protected)
- `GET /api/notifications/unread-count` - Get unread count (Protected)

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics (Admin, Protected)
- `GET /api/admin/complaints` - All complaints (Admin, Protected)
- `POST /api/admin/complaints/:id/assign` - Assign complaint (Admin, Protected)
- `GET /api/admin/stats` - Stats by date range (Admin, Protected)

## 📱 Features Breakdown

### Complaint Submission
- Title and description
- Category selection (Pothole, Street Light, Water, Electricity, Cleanliness, Other)
- GPS location capture
- Photo upload (up to 5MB)
- Address field

### Status Tracking
- Pending → In Progress → Resolved → Closed
- Real-time updates via notifications
- Activity log with timestamps
- Resolution notes

### Dashboard Analytics
- Total complaints count
- Status-wise distribution (Chart.js)
- Category-wise breakdown
- Average resolution time
- Priority-based filtering

## 🗄️ Database Schema

### Main Tables
1. **users** - Citizens and admins
2. **complaints** - Complaint data with location
3. **notifications** - User notifications
4. **activity_logs** - Complaint history
5. **dashboard_stats** - Statistics cache

All tables include proper indexes for query optimization and foreign keys for data integrity.

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=civic_app_db
JWT_SECRET=your_secret_key
JWT_EXPIRY=7d
CORS_ORIGIN=http://localhost:3000
GOOGLE_MAPS_API_KEY=your_api_key
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key
```

## 📈 Scalability & Best Practices

- ✅ MVC Architecture for separation of concerns
- ✅ JWT for secure authentication
- ✅ Input validation with Joi
- ✅ Error handling middleware
- ✅ Database indexing for performance
- ✅ CORS enabled for security
- ✅ File upload restrictions
- ✅ Rate limiting ready
- ✅ Modular component structure
- ✅ Context API for state management

## 🐛 Testing

### Sample Test Data
- Admin account is pre-configured
- Sample citizen accounts available in database
- Test complaints with various statuses are seeded

### Testing Steps
1. Register as citizen with phone: `9876543210`
2. Login as admin: `admin@example.com` / `password`
3. Submit a complaint with location and image
4. View status updates in real-time
5. Admin can update complaint status

## 📝 Code Quality

- Clean, production-ready code
- Comprehensive comments and documentation
- Consistent naming conventions
- Modular architecture
- Error handling at all levels
- Input validation and sanitization

## 🚀 Deployment

### Frontend (Vercel)
```bash
npm run build
vercel deploy
```

### Backend (Heroku)
```bash
heroku create your-app
git push heroku main
```

## 📚 Additional Resources

- [API Documentation](./docs/API.md)
- [Setup Guide](./docs/SETUP.md)
- [Database Schema](./database/schema.sql)

## 🤝 Contributing

This is a complete, standalone application. For modifications:
1. Follow the existing code structure
2. Add comments for complex logic
3. Test all changes
4. Update documentation

## 📞 Support

For issues or questions:
1. Check the API documentation
2. Review database schema
3. Check environment variables
4. Review error logs

## 📄 License

This project is for educational and governmental use in Tamil Nadu.

## ✨ Features Checklist

- [x] User Authentication (OTP + JWT)
- [x] Complaint Submission with Images
- [x] Location-based Reporting
- [x] Real-time Notifications
- [x] Admin Dashboard
- [x] Analytics & Charts
- [x] Status Tracking
- [x] Activity Logs
- [x] File Upload Handling
- [x] Input Validation
- [x] Error Handling
- [x] Database Optimization
- [x] RESTful API
- [x] Production-ready Code
- [x] Comprehensive Documentation

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**Status:** Production Ready ✅
