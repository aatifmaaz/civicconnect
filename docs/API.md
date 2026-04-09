# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Response Format

All responses are JSON:
```json
{
  "success": true,
  "message": "Success message",
  "data": {}
}
```

---

## Authentication Endpoints

### 1. Register User (Citizen)
**POST** `/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "9876543210",
  "email": "john@example.com",
  "address": "123 Street, City"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your phone",
  "phone": "9876543210"
}
```

### 2. Verify OTP
**POST** `/auth/verify-otp`

**Request Body:**
```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Phone verified successfully",
  "token": "eyJhbGc...",
  "userId": 1,
  "role": "citizen"
}
```

### 3. Admin Login
**POST** `/auth/admin-login`

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGc...",
  "userId": 1,
  "role": "admin"
}
```

### 4. Get User Profile
**GET** `/auth/profile`

**Headers:** Authorization required

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "phone": "9876543210",
    "email": "john@example.com",
    "address": "123 Street, City",
    "latitude": "13.0827",
    "longitude": "80.2707",
    "role": "citizen",
    "is_verified": true
  }
}
```

---

## Complaint Endpoints

### 1. Submit Complaint
**POST** `/complaints/create`

**Headers:** Authorization required, Content-Type: multipart/form-data

**Request Body (FormData):**
- `title` (string, required) - Complaint title
- `description` (string, required) - Detailed description
- `category` (string, required) - pothole, streetlight, water, electricity, cleanliness, other
- `latitude` (number, required) - GPS latitude
- `longitude` (number, required) - GPS longitude
- `address` (string, optional) - Street address
- `image` (file, optional) - Image file (max 5MB)

**Response:**
```json
{
  "success": true,
  "message": "Complaint registered successfully",
  "complaintId": 42
}
```

### 2. Get My Complaints
**GET** `/complaints/my?page=1&limit=10`

**Headers:** Authorization required

**Query Parameters:**
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "complaints": [
    {
      "id": 1,
      "title": "Pothole on Main Street",
      "description": "Large pothole...",
      "category": "pothole",
      "image_url": "/uploads/image.jpg",
      "status": "pending",
      "priority": "high",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### 3. Get Complaint Details
**GET** `/complaints/:id`

**Headers:** Authorization required

**Response:**
```json
{
  "success": true,
  "complaint": {
    "id": 1,
    "title": "Pothole on Main Street",
    "description": "Large pothole near intersection",
    "category": "pothole",
    "image_url": "/uploads/image.jpg",
    "latitude": "13.0827",
    "longitude": "80.2707",
    "address": "Anna Nagar, Chennai",
    "status": "in_progress",
    "priority": "high",
    "submitted_by": "John Doe",
    "phone": "9876543210",
    "created_at": "2024-01-15T10:30:00Z",
    "resolved_at": null
  },
  "history": [
    {
      "action": "created",
      "new_status": "pending",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "action": "status_update",
      "old_status": "pending",
      "new_status": "in_progress",
      "notes": "Assigned to repair team",
      "created_at": "2024-01-16T09:00:00Z"
    }
  ]
}
```

### 4. Search Complaints
**GET** `/complaints?status=pending&category=pothole&page=1&limit=10`

**Query Parameters:**
- `status` (string, optional) - pending, in_progress, resolved, closed
- `category` (string, optional) - pothole, streetlight, water, electricity, cleanliness, other
- `priority` (string, optional) - low, medium, high, critical
- `latitude` (number, optional) - For radius search
- `longitude` (number, optional) - For radius search
- `radius` (number, optional) - Radius in km
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 10)

**Response:** Same as Get My Complaints

### 5. Update Complaint Status (Admin)
**PUT** `/complaints/:id/status`

**Headers:** Authorization required (Admin only)

**Request Body:**
```json
{
  "status": "resolved",
  "notes": "Pothole has been filled successfully"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Complaint status updated successfully"
}
```

---

## Notification Endpoints

### 1. Get Notifications
**GET** `/notifications?page=1&limit=20`

**Headers:** Authorization required

**Query Parameters:**
- `page` (number) - Page number
- `limit` (number) - Items per page

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": 1,
      "complaint_id": 42,
      "title": "Status Update",
      "message": "Your complaint status has been updated to: in_progress",
      "type": "status_update",
      "is_read": false,
      "created_at": "2024-01-16T09:00:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

### 2. Mark Notification as Read
**PUT** `/notifications/:id/read`

**Headers:** Authorization required

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### 3. Mark All as Read
**PUT** `/notifications/mark-all-read`

**Headers:** Authorization required

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

### 4. Get Unread Count
**GET** `/notifications/unread-count`

**Headers:** Authorization required

**Response:**
```json
{
  "success": true,
  "unreadCount": 3
}
```

---

## Admin Endpoints

### 1. Get Dashboard Statistics
**GET** `/admin/dashboard`

**Headers:** Authorization required (Admin only)

**Response:**
```json
{
  "success": true,
  "stats": {
    "overall": {
      "total_complaints": 150,
      "pending_complaints": 30,
      "in_progress_complaints": 50,
      "resolved_complaints": 60,
      "closed_complaints": 10,
      "critical_complaints": 5
    },
    "users": {
      "total_users": 500,
      "total_citizens": 450,
      "total_admins": 50
    },
    "categories": [
      {
        "category": "pothole",
        "count": 45
      },
      {
        "category": "streetlight",
        "count": 38
      }
    ],
    "statusDistribution": [
      {
        "status": "pending",
        "count": 30
      }
    ],
    "resolutionTime": {
      "avg_resolution_days": 4.5
    }
  }
}
```

### 2. Get All Complaints (Admin View)
**GET** `/admin/complaints?page=1&limit=20`

**Headers:** Authorization required (Admin only)

**Response:**
```json
{
  "success": true,
  "complaints": [
    {
      "id": 1,
      "title": "Pothole on Main Street",
      "description": "Large pothole...",
      "category": "pothole",
      "status": "in_progress",
      "priority": "high",
      "submitted_by": "John Doe",
      "phone": "9876543210",
      "assigned_admin": "Admin Name",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

### 3. Assign Complaint to Admin
**POST** `/admin/complaints/:id/assign`

**Headers:** Authorization required (Admin only)

**Request Body:**
```json
{
  "assignToAdminId": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Complaint assigned to Admin Name"
}
```

### 4. Get Statistics by Date Range
**GET** `/admin/stats?startDate=2024-01-01&endDate=2024-01-31`

**Headers:** Authorization required (Admin only)

**Query Parameters:**
- `startDate` (string, required) - Format: YYYY-MM-DD
- `endDate` (string, required) - Format: YYYY-MM-DD

**Response:**
```json
{
  "success": true,
  "stats": [
    {
      "date": "2024-01-15",
      "total_complaints": 5,
      "resolved": 2,
      "pending": 3
    }
  ]
}
```

---

## Error Responses

### Validation Error
```json
{
  "success": false,
  "message": "Please enter a valid 10-digit phone number"
}
```

### Authentication Error
```json
{
  "success": false,
  "message": "No token provided"
}
```

### Authorization Error
```json
{
  "success": false,
  "message": "Admin access required"
}
```

### Server Error
```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

---

## Status Codes

- **200** - OK
- **201** - Created
- **400** - Bad Request
- **401** - Unauthorized (No/Invalid Token)
- **403** - Forbidden (Insufficient Permissions)
- **404** - Not Found
- **409** - Conflict (Duplicate Entry)
- **500** - Internal Server Error

---

## Rate Limiting

Not implemented yet, but can be added using express-rate-limit middleware.

## File Upload

- **Allowed Formats:** JPEG, PNG, GIF, WebP
- **Max File Size:** 5MB
- **Storage Location:** `/uploads` directory
- **URL Format:** `/uploads/filename`

---

## Pagination

Standard pagination parameters:
- `page` - Page number (1-indexed)
- `limit` - Items per page
- `total` - Total items count
- `pages` - Total pages count

---

**Last Updated:** 2024  
**Version:** 1.0.0
