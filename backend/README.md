# Backend - API Server

Node.js + Express.js REST API for Civic Hub Application

## Overview

Production-ready backend server with:
- RESTful API endpoints
- JWT Authentication
- OTP-based user verification
- File upload handling
- MVC Architecture
- Comprehensive error handling
- MySQL database integration

## Directory Structure

```
src/
├── controllers/          # Request handlers
│   ├── authController.js       # Auth logic
│   ├── complaintController.js  # Complaint logic
│   ├── adminController.js      # Admin operations
│   └── notificationController.js # Notifications
├── routes/              # API routes
│   ├── authRoutes.js
│   ├── complaintRoutes.js
│   ├── adminRoutes.js
│   └── notificationRoutes.js
├── services/            # Business logic
│   ├── AuthService.js
│   ├── ComplaintService.js
│   ├── NotificationService.js
│   └── AdminService.js
├── middleware/          # Express middleware
│   ├── auth.js              # JWT verification
│   ├── validation.js        # Input validation
│   └── errorHandler.js      # Error handling
├── utils/               # Helper functions
│   ├── jwt.js
│   ├── otp.js
│   └── fileUpload.js
├── config/              # Configuration
│   └── database.js      # MySQL connection & init
└── server.js            # Entry point
```

## Features

### Authentication
- Phone-based OTP registration for citizens
- JWT token-based authentication
- Admin email/password login
- Secure password hashing with bcrypt

### Complaint Management
- Submit complaints with images
- Location tracking (GPS coordinates)
- Multiple categories support
- Status workflow (pending → in progress → resolved → closed)
- Activity logging
- Admin assignment

### Notifications
- Real-time status updates
- Notification history
- Mark as read functionality
- Unread count tracking

### Admin Dashboard
- Comprehensive statistics
- Complaint trending
- Category-wise breakdown
- Resolution time metrics
- User management

## API Endpoints

See [API Documentation](../docs/API.md) for complete endpoint reference.

### Quick Reference

**Auth:**
- POST /auth/register
- POST /auth/verify-otp
- POST /auth/admin-login
- GET /auth/profile

**Complaints:**
- POST /complaints/create
- GET /complaints/my
- GET /complaints/:id
- PUT /complaints/:id/status
- GET /complaints/search

**Notifications:**
- GET /notifications
- PUT /notifications/:id/read
- PUT /notifications/mark-all-read
- GET /notifications/unread-count

**Admin:**
- GET /admin/dashboard
- GET /admin/complaints
- POST /admin/complaints/:id/assign
- GET /admin/stats

## Dependencies

### Production
- **express** - Web framework
- **mysql2** - MySQL client
- **dotenv** - Environment variables
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT handling
- **multer** - File uploads
- **joi** - Input validation
- **cors** - Cross-origin requests
- **helmet** - Security headers

### Development
- **nodemon** - Auto-reload
- **jest** - Testing (optional)

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file with database credentials

3. Start server:
   ```bash
   npm run dev
   ```

## Database

- MySQL 8.0+
- Automatically initializes tables on startup
- Supports 5+ concurrent connections
- Indexed for performance

### Tables
- users
- complaints
- notifications
- activity_logs
- dashboard_stats

## Security Features

✅ JWT authentication  
✅ Input validation with Joi  
✅ Password hashing with bcryptjs  
✅ CORS enabled  
✅ Helmet headers  
✅ File upload restrictions  
✅ SQL injection prevention  
✅ Error message sanitization  

## Error Handling

- Centralized error handler middleware
- Meaningful error messages
- HTTP status codes
- Request validation
- Database error handling

## File Upload

- Supported formats: JPEG, PNG, GIF, WebP
- Max size: 5MB (configurable)
- Stored in `/uploads` directory
- Accessible via `/uploads/filename` URL

## Environment Variables

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=civic_app_db
JWT_SECRET=secret_key
JWT_EXPIRY=7d
CORS_ORIGIN=http://localhost:3000
```

## Running Tests

```bash
npm test
```

## Build & Deploy

### Production Build
```bash
npm start
```

### Docker (Optional)
```bash
docker build -t civic-app-backend .
docker run -p 5000:5000 civic-app-backend
```

### Heroku
```bash
heroku create your-app
git push heroku main
```

## Performance Optimization

- Database connection pooling
- Indexed queries
- Pagination for large datasets
- Response compression (ready)
- Caching ready (Redis)

## Monitoring

- Server logs on startup
- Error logs in console
- Database connection status
- Request/response logging (ready)

## Future Enhancements

- [ ] Rate limiting
- [ ] Request logging with Winston
- [ ] Email notifications
- [ ] SMS integration (Twilio)
- [ ] WebSocket support
- [ ] Advanced analytics
- [ ] Caching layer (Redis)
- [ ] Automated job processing (Bull)

## License

Civic Hub Backend - Production Ready

## Support

For issues or questions, check:
1. Setup guide in docs/SETUP.md
2. API documentation in docs/API.md
3. Server logs for error details
