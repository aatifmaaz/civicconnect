# Taluk-Based Filtering Implementation Guide

## Overview
This guide documents the taluk-based filtering feature that allows users to register with a specific taluk and admins to send updates to specific taluks.

## Features Implemented

### 1. User Registration with Taluk Selection
Users must select their district and taluk during registration. This ensures they receive updates only relevant to their locality.

**Location**: [frontend/src/pages/register.js](frontend/src/pages/register.js#L265-L305)

#### Key Components:
- **District Selection Dropdown**: Lists all Tamil Nadu districts
- **Taluk Selection Dropdown**: Dynamically populated based on selected district
- Both fields are mandatory and validated before submission

#### Form Flow:
```
Step 1: Personal Details
├─ Name (required)
├─ Phone (required, 10 digits)
├─ Email (required, valid format)
├─ Address (optional)
├─ District (required)
└─ Taluk (required, dependent on district)

Step 2: Password
├─ Password (minimum 6 characters, required)
└─ Confirm Password
```

#### Backend Registration Handler
**Location**: [backend/src/controllers/authController.js](backend/src/controllers/authController.js#L11-L40)

Validates:
- District selection is required
- Taluk selection is required
- Both values must be non-empty

**Database**: Users are stored with `district` and `taluk` fields in the `users` table.

---

### 2. Municipality Updates with Taluk Targeting
Admins can create announcements and target them to specific taluks. Users receive updates only for their registered taluk.

**Location**: [frontend/src/pages/admin/dashboard.js](frontend/src/pages/admin/dashboard.js#L631-L700)

#### Announcement Creation Form:
- **Title**: Announcement title (max 200 characters)
- **Content**: Detailed announcement content
- **District**: Select target district (required)
- **Taluk**: Select target taluk within the district (required)
- **Visibility Options**:
  - Permanent: Stays until manually removed
  - Timed: Automatically expires on specified date/time

#### Form Validation:
```javascript
- Title and content are required (non-empty)
- District and taluk MUST be selected
- If not permanent, expiry date must be in the future
```

**Backend Handler**: [backend/src/controllers/announcementController.js](backend/src/controllers/announcementController.js#L39-L73)

---

### 3. Filtered Announcements Display
Users see only announcements relevant to their taluk.

#### User Dashboard
**Location**: [frontend/src/pages/dashboard.js](frontend/src/pages/dashboard.js#L85-L92)

```javascript
const fetchAnnouncements = async (userData) => {
  try {
    const userTaluk = userData?.taluk;
    const response = await announcementAPI.getActive(userTaluk);
    setAnnouncements(response.data.data || []);
  } catch (error) {
    console.error('Error fetching municipality updates:', error);
  }
};
```

**How it Works**:
1. When user logs in, their taluk is retrieved from user profile
2. Announcements are fetched with taluk as a query parameter
3. Backend filters announcements to show only those for the user's taluk
4. Announcement visibility logic considers:
   - Active (not yet expired)
   - Permanent (no expiry)
   - Global announcements (taluk = NULL)

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(15) UNIQUE NOT NULL,
  address TEXT,
  district VARCHAR(100),
  taluk VARCHAR(100),
  role ENUM('citizen', 'admin') DEFAULT 'citizen',
  password_hash VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_district (district),
  INDEX idx_taluk (taluk)
);
```

### Announcements Table
```sql
CREATE TABLE announcements (
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
  INDEX idx_district (district),
  INDEX idx_taluk (taluk),
  INDEX idx_created_at (created_at),
  INDEX idx_is_permanent (is_permanent),
  INDEX idx_expires_at (expires_at)
);
```

---

## API Endpoints

### User Registration
**Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
  "name": "John Doe",
  "phone": "9876543210",
  "email": "john@example.com",
  "address": "123 Main St",
  "district": "Chennai",
  "taluk": "Ambattur",
  "password": "securePassword123"
}
```

**Validation**:
- District and taluk are required
- All fields validated before user creation

---

### Get Announcements (User)
**Endpoint**: `GET /api/announcements?taluk=Ambattur`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Water Supply Maintenance",
      "content": "Water supply will be suspended...",
      "district": "Chennai",
      "taluk": "Ambattur",
      "is_permanent": false,
      "expires_at": "2026-04-15T10:00:00Z",
      "created_by_name": "Admin Name",
      "created_at": "2026-04-04T10:00:00Z"
    }
  ]
}
```

**Filtering Logic**:
- Returns only announcements where:
  - `taluk` matches user's taluk, OR
  - `taluk` is NULL (global announcements)
- Only active announcements (not expired)

---

### Create Announcement (Admin)
**Endpoint**: `POST /api/admin/announcements`

**Request Body**:
```json
{
  "title": "Road Closure Notice",
  "content": "Main Street will be closed for repairs from 10 AM to 4 PM",
  "district": "Chennai",
  "taluk": "Ambattur",
  "isPermanent": false,
  "expiresAt": "2026-04-10T18:00:00Z"
}
```

**Validation**:
- Title and content required
- District and taluk required
- If not permanent, expiresAt must be in the future

**Notification Flow**:
1. Announcement is created with district/taluk
2. System finds all users in that taluk with email
3. Notifications are created for each user
4. Email notifications sent to all recipients

---

## District & Taluk Data

The application includes complete Tamil Nadu district and taluk data in:
[frontend/src/utils/taluks.js](frontend/src/utils/taluks.js)

This file contains:
- 38 Tamil Nadu districts
- 533+ taluks across all districts
- Helper function `getTaluksForDistrict(district)` for dynamic filtering

**Example Data Structure**:
```javascript
export const talukData = {
  "Chennai": ["Alandur", "Ambattur", "Aminjikarai", ...],
  "Kancheepuram": ["Kancheepuram", "Kundrathur", "Sriperumbudur", ...],
  // ... more districts
};
```

---

## User Flow Diagrams

### User Registration Flow
```
User visits /register
    ↓
Select District (dropdown)
    ↓
Select Taluk (dynamically populated)
    ↓
Enter other details (name, email, phone)
    ↓
Create password
    ↓
Account created with district & taluk
    ↓
User logged in & redirected to dashboard
```

### Announcement Reception Flow
```
Admin creates announcement
    ↓
Selects target District & Taluk
    ↓
Announcement stored in database with district/taluk
    ↓
System identifies all users in that taluk
    ↓
Notifications created for each user
    ↓
Emails sent to all recipients
    ↓
Users see update in their dashboard
(filtered by their taluk)
```

---

## Testing Checklist

### Registration Testing
- [ ] User can register with district selection
- [ ] Taluk dropdown is enabled only after district selection
- [ ] Cannot submit registration without district
- [ ] Cannot submit registration without taluk
- [ ] User data is saved with correct district/taluk

### Announcement Testing
- [ ] Admin can create announcement with district/taluk
- [ ] Cannot submit without selecting district
- [ ] Cannot submit without selecting taluk
- [ ] Announcement is stored with correct district/taluk
- [ ] User sees only announcements for their taluk
- [ ] Users in different taluk don't see announcements

### Admin Dashboard Testing
- [ ] Admin can filter announcements by taluk
- [ ] Taluk-specific admin sees only their taluk's data
- [ ] Super-admin can see all taluks
- [ ] Announcement list shows district/taluk information

---

## Important Notes

1. **Taluk Selection is Mandatory**: Both during registration and announcement creation
2. **Dynamic Filtering**: Taluk dropdown is dynamically populated based on selected district
3. **Global Announcements**: Set taluk to NULL in database for announcements visible to all taluks
4. **Email Notifications**: Each announcement sends emails to all users in the target taluk
5. **Admin Scope**: Regular admins can only work with their assigned taluk; super-admins see all

---

## Files Modified/Created

### Backend
- `src/controllers/authController.js` - Handles taluk in registration
- `src/controllers/announcementController.js` - Handles taluk in announcements
- `src/services/AnnouncementService.js` - Filters by taluk
- `src/utils/taluks.js` - Taluk data (if applicable)

### Frontend
- `pages/register.js` - Registration form with taluk selector
- `pages/dashboard.js` - Fetches announcements by taluk
- `pages/admin/dashboard.js` - Admin creates announcements with taluk
- `utils/taluks.js` - District/taluk data and helper functions
- `services/api.js` - API calls for announcements

### Database
- `database/schema.sql` - Users and announcements tables with taluk fields

---

## Troubleshooting

### Taluk dropdown not showing values
**Solution**: Verify that `getTaluksForDistrict()` is imported from `utils/taluks.js`

### Users seeing announcements from other taluks
**Solution**: Check that announcement query includes taluk parameter:
```javascript
getActive(userTaluk) // Must pass taluk
```

### Announcements not showing for users
**Solution**: Verify that:
1. Admin selected correct district/taluk
2. User registered with matching taluk
3. Announcement expiry date is in the future

### Database errors
**Solution**: Ensure announcements table has `taluk` column:
```sql
ALTER TABLE announcements ADD COLUMN taluk VARCHAR(100);
```

---

## Future Enhancements

1. **Admin Taluk Assignment**: Allow super-admins to assign taluks to admin users
2. **Announcement Analytics**: Track announcement engagement by taluk
3. **Duplicate Prevention**: Warn if announcement already exists for taluk/date
4. **Scheduled Announcements**: Schedule announcements to be published at specific times
5. **Announcement Categories**: Categorize announcements (Water, Roads, Events, etc.)
6. **User Preferences**: Allow users to choose notification methods per taluk

---

## Support

For issues or questions about the taluk-based filtering feature, please refer to the relevant source files or contact the development team.

Last Updated: April 4, 2026
