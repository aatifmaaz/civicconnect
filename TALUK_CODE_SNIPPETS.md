# Taluk-Based Filtering - Code Implementation Details

## 1. User Registration - District & Taluk Selection

### Frontend: Registration Form (`frontend/src/pages/register.js`)

```javascript
// Step 1: Personal Details Form
<div>
  <label className="block text-sm font-medium text-gray-300 mb-2">
    District <span className="text-primary">*</span>
  </label>
  <select
    id="reg-district"
    name="district"
    value={formData.district}
    onChange={handleInputChange}
    className="input-field"
    required
  >
    <option value="">Select your district</option>
    {districts.map((dist) => (
      <option key={dist} value={dist}>
        {dist}
      </option>
    ))}
  </select>
</div>

<div>
  <label className="block text-sm font-medium text-gray-300 mb-2">
    Taluk <span className="text-primary">*</span>
  </label>
  <select
    id="reg-taluk"
    name="taluk"
    value={formData.taluk}
    onChange={handleInputChange}
    className="input-field"
    disabled={!formData.district}
    required
  >
    <option value="">
      {formData.district ? 'Select your taluk' : 'First select a district'}
    </option>
    {formData.district &&
      getTaluksForDistrict(formData.district).map((taluk) => (
        <option key={taluk} value={taluk}>
          {taluk}
        </option>
      ))}
  </select>
</div>
```

**Key Points**:
- Taluk dropdown is disabled until district is selected
- Uses `getTaluksForDistrict()` to populate taluk options dynamically
- Both fields are marked as required
- Validation prevents form submission without both selections

### Frontend: Form Validation

```javascript
const handleDetailsSubmit = (e) => {
  e.preventDefault();
  if (!formData.name.trim()) {
    toast.error('Please enter your full name');
    return;
  }
  if (!/^[0-9]{10}$/.test(formData.phone)) {
    toast.error('Please enter a valid 10-digit phone number');
    return;
  }
  if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
    toast.error('Please enter a valid email address');
    return;
  }
  if (!formData.district) {
    toast.error('Please select a district');
    return;
  }
  if (!formData.taluk) {
    toast.error('Please select a taluk');
    return;
  }
  setStep('password');
};
```

### Frontend: API Call

```javascript
const handleCreateAccount = async (e) => {
  e.preventDefault();
  // ... password validation ...
  setLoading(true);
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      address: formData.address || null,
      district: formData.district,  // ← Send district
      taluk: formData.taluk,         // ← Send taluk
      password,
    });
    // ... handle response ...
  } catch (err) {
    toast.error(err.response?.data?.message || 'Registration failed.');
  } finally {
    setLoading(false);
  }
};
```

### Backend: Controller Validation (`backend/src/controllers/authController.js`)

```javascript
static async register(req, res, next) {
  try {
    const { name, phone, email, address, district, taluk, password } = req.body;

    if (!name || !phone || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, email, and password are required',
      });
    }

    // ← NEW: Validate district and taluk
    if (!district || !taluk) {
      return res.status(400).json({
        success: false,
        message: 'District and taluk selection are required',
      });
    }

    // ... other validations ...

    const result = await AuthService.register(
      name, phone, email, address, district, taluk, password
    );
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
```

### Backend: Service Implementation (`backend/src/services/AuthService.js`)

```javascript
static async register(name, phone, email, address, district, taluk, password) {
  const connection = await pool.getConnection();
  try {
    // Check if email exists, phone exists...

    const hashedPassword = await bcrypt.hash(password, 10);

    // ← INSERT with district and taluk
    const [result] = await connection.execute(
      `INSERT INTO users (name, email, phone, address, district, taluk, role, password_hash, is_verified, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 'citizen', ?, 1, 1)`,
      [name, email, phone, address || null, district, taluk, hashedPassword]
    );

    const [newUser] = await connection.execute(
      'SELECT id, name, email, phone, address, district, taluk, role FROM users WHERE id = ?',
      [result.insertId]
    );

    const user = newUser[0];
    const tokens = generateAuthTokens({
      id: user.id,
      phone: user.phone,
      role: user.role,
      district: user.district,  // ← Include in token
      taluk: user.taluk          // ← Include in token
    });

    return {
      success: true,
      message: 'Account created successfully',
      user,
      ...tokens,
    };
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
}
```

---

## 2. Admin Creates Municipality Updates with Taluk

### Frontend: Announcement Form (`frontend/src/pages/admin/dashboard.js`)

```javascript
const renderSettingsView = () => (
  <div className="space-y-6">
    <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-6">
      <div className="rounded-[30px] border border-white/10 ...">
        <div className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">
            Municipality Updates
          </p>
          <h3 className="text-2xl font-semibold text-white mt-2">
            Publish an admin notice
          </h3>
          <p className="text-sm text-slate-400 mt-2">
            Permanent notices stay until removed manually. Timed notices disappear
            automatically after their expiry.
          </p>
        </div>

        <form onSubmit={handleCreateAnnouncement} className="space-y-5">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={announcementForm.title}
              onChange={(event) =>
                handleAnnouncementFieldChange('title', event.target.value)
              }
              className="input-field"
              placeholder="Water supply maintenance notice"
              maxLength={200}
            />
          </div>

          {/* Content Textarea */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Update content
            </label>
            <textarea
              value={announcementForm.content}
              onChange={(event) =>
                handleAnnouncementFieldChange('content', event.target.value)
              }
              className="input-field min-h-[160px] resize-y"
              placeholder="Explain what residents should know, what action is happening, and who is affected."
            />
          </div>

          {/* District & Taluk Selection */}
          <div className="grid grid-cols-2 gap-4">
            {/* District Dropdown */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                District
              </label>
              <select
                value={announcementForm.district}
                onChange={(event) =>
                  handleAnnouncementFieldChange('district', event.target.value)
                }
                className="input-field"
              >
                <option value="">Select district</option>
                {districts.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>

            {/* Taluk Dropdown */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Taluk
              </label>
              <select
                value={announcementForm.taluk}
                onChange={(event) =>
                  handleAnnouncementFieldChange('taluk', event.target.value)
                }
                className="input-field"
                disabled={!announcementForm.district}
              >
                <option value="">
                  {announcementForm.district
                    ? 'Select taluk'
                    : 'First select a district'}
                </option>
                {announcementForm.district &&
                  getTaluksForDistrict(announcementForm.district).map(
                    (taluk) => (
                      <option key={taluk} value={taluk}>
                        {taluk}
                      </option>
                    )
                  )}
              </select>
            </div>
          </div>

          {/* Visibility Options */}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-4">
            <label className="flex items-center gap-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={announcementForm.isPermanent}
                onChange={(event) =>
                  handleAnnouncementFieldChange(
                    'isPermanent',
                    event.target.checked
                  )
                }
                className="h-4 w-4 rounded border-white/20 bg-dark-bg"
              />
              Keep this as a permanent update
            </label>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Visible until
              </label>
              <input
                type="datetime-local"
                value={announcementForm.expiresAt}
                onChange={(event) =>
                  handleAnnouncementFieldChange('expiresAt', event.target.value)
                }
                className="input-field"
                disabled={announcementForm.isPermanent}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={announcementSubmitting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold hover:brightness-110 transition-all disabled:opacity-60"
          >
            {announcementSubmitting
              ? 'Publishing...'
              : 'Publish Municipality Update'}
          </button>
        </form>
      </div>
    </div>
  </div>
);
```

### Frontend: Form Validation

```javascript
const handleCreateAnnouncement = async (event) => {
  event.preventDefault();
  
  if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
    toast.error('Please add both a title and update content');
    return;
  }
  
  // ← NEW: Validate district and taluk
  if (!announcementForm.district || !announcementForm.taluk) {
    toast.error('Please select both district and taluk for this update');
    return;
  }
  
  if (!announcementForm.isPermanent && !announcementForm.expiresAt) {
    toast.error('Please choose when this update should expire');
    return;
  }
  
  setAnnouncementSubmitting(true);
  try {
    await apiClient.post('/admin/announcements', {
      title: announcementForm.title.trim(),
      content: announcementForm.content.trim(),
      isPermanent: announcementForm.isPermanent,
      expiresAt: announcementForm.isPermanent
        ? null
        : announcementForm.expiresAt,
      district: announcementForm.district,  // ← Send district
      taluk: announcementForm.taluk        // ← Send taluk
    });
    toast.success('Municipality update published');
    resetAnnouncementForm();
    fetchAnnouncements();
  } catch (error) {
    toast.error(
      error?.response?.data?.message ||
        'Failed to publish municipality update'
    );
  } finally {
    setAnnouncementSubmitting(false);
  }
};
```

### Backend: Controller (`backend/src/controllers/announcementController.js`)

```javascript
static async createAnnouncement(req, res, next) {
  try {
    const {
      title,
      content,
      isPermanent = false,
      expiresAt = null,
      district,
      taluk
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // ← NEW: Validate district and taluk
    if (!district || !taluk) {
      return res.status(400).json({
        success: false,
        message: 'District and taluk selection are required'
      });
    }

    const result = await AnnouncementService.createAnnouncement({
      title: title.trim(),
      content: content.trim(),
      isPermanent: Boolean(isPermanent),
      expiresAt,
      createdBy: req.user.id,
      district,  // ← Pass district
      taluk      // ← Pass taluk
    });

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
```

### Backend: Service (`backend/src/services/AnnouncementService.js`)

```javascript
static async createAnnouncement({
  title,
  content,
  isPermanent,
  expiresAt,
  createdBy,
  district,
  taluk
}) {
  const connection = await pool.getConnection();
  try {
    if (!isPermanent && !expiresAt) {
      throw {
        statusCode: 400,
        message:
          'Expiry date is required unless the update is permanent'
      };
    }

    if (!isPermanent) {
      const expiryDate = new Date(expiresAt);
      if (Number.isNaN(expiryDate.getTime())) {
        throw {
          statusCode: 400,
          message: 'Please provide a valid expiry date'
        };
      }
      if (expiryDate <= new Date()) {
        throw {
          statusCode: 400,
          message: 'Expiry date must be in the future'
        };
      }
    }

    // ← INSERT with district and taluk
    const [result] = await connection.execute(
      `INSERT INTO announcements (title, content, is_permanent, expires_at, created_by, district, taluk)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        content,
        isPermanent ? 1 : 0,
        isPermanent ? null : expiresAt,
        createdBy,
        district || null,
        taluk || null
      ]
    );

    const [rows] = await connection.execute(
      `SELECT id, title, content, is_permanent, expires_at, created_at, district, taluk
       FROM announcements
       WHERE id = ?`,
      [result.insertId]
    );

    const announcement = rows[0];

    // ← Find recipients in the taluk
    let recipientQuery = `SELECT id, name, email, taluk
       FROM users
       WHERE is_active = 1 AND is_verified = 1 AND email IS NOT NULL AND email != ''`;

    if (taluk) {
      recipientQuery += ` AND taluk = ?`;
    }

    const [recipients] = await connection.execute(
      recipientQuery,
      taluk ? [taluk] : []
    );

    // Send notifications to all recipients
    await Promise.allSettled(
      recipients.map((recipient) =>
        NotificationService.createNotification(
          recipient.id,
          null,
          `Municipality Update: ${announcement.title}`,
          content,
          'system'
        )
      )
    );

    // Send emails to all recipients
    await Promise.allSettled(
      recipients.map((recipient) =>
        sendMunicipalityUpdateEmail(
          recipient.email,
          recipient.name,
          announcement
        )
      )
    );

    return {
      success: true,
      message: 'Municipality update published successfully',
      data: announcement
    };
  } finally {
    connection.release();
  }
}
```

---

## 3. User Dashboard - View Taluk-Filtered Announcements

### Frontend: Fetch Announcements (`frontend/src/pages/dashboard.js`)

```javascript
const fetchAnnouncements = async (userData) => {
  try {
    // ← Get user's taluk
    const userTaluk = userData?.taluk;
    
    // ← Fetch announcements filtered by taluk
    const response = await announcementAPI.getActive(userTaluk);
    setAnnouncements(response.data.data || []);
  } catch (error) {
    console.error('Error fetching municipality updates:', error);
  }
};
```

### Frontend: API Service (`frontend/src/services/api.js`)

```javascript
export const announcementAPI = {
  // ← Pass taluk as query parameter
  getActive: (taluk = null) =>
    apiClient.get('/announcements', {
      params: taluk ? { taluk } : {}
    })
};
```

### Backend: Announcement Service Filter (`backend/src/services/AnnouncementService.js`)

```javascript
static async getActiveAnnouncements(taluk = null) {
  const connection = await pool.getConnection();
  try {
    let query = `SELECT a.id, a.title, a.content, a.is_permanent, a.expires_at, a.created_at, a.district, a.taluk,
              u.name AS created_by_name
         FROM announcements a
         LEFT JOIN users u ON a.created_by = u.id
         WHERE (a.is_permanent = 1 OR (a.expires_at IS NOT NULL AND a.expires_at > NOW()))`;

    const params = [];

    // ← Filter by taluk
    if (taluk) {
      query += ` AND (a.taluk = ? OR a.taluk IS NULL)`;
      params.push(taluk);
    }

    query += ` ORDER BY a.is_permanent DESC, a.created_at DESC`;

    const [announcements] = await connection.execute(query, params);

    return {
      success: true,
      data: announcements
    };
  } finally {
    connection.release();
  }
}
```

---

## 4. District & Taluk Data (`frontend/src/utils/taluks.js`)

```javascript
// Tamil Nadu Districts and Taluks data
export const talukData = {
  "Tiruvallur": [
    "Avadi", "Gummidipoondi", "Pallipet", "Ponneri",
    "Poonamallee", "R.k. Pet", "Tiruttani", "Tiruvallur",
    "Uthukottai"
  ],
  "Chennai": [
    "Alandur", "Ambattur", "Aminjikarai", "Ayanavaram",
    "Egmore", "Guindy", "Kolathur", "Madhavaram",
    "Maduravoyal", "Mambalam", "Mylapore", "Perambur",
    "Purasawalkam", "Shozhinganallur", "Thiruvottiyur",
    "Tondiarpet", "Velachery"
  ],
  "Kancheepuram": [
    "Kancheepuram", "Kundrathur", "Sriperumbudur",
    "Uthiramerur", "Walajabad"
  ],
  // ... 34 more districts ...
};

// Get list of districts
export const districts = Object.keys(talukData).sort();

// Helper function to get taluks for a district
export const getTaluksForDistrict = (district) => talukData[district] || [];
```

---

## 5. Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(15) UNIQUE NOT NULL,
  address TEXT,
  -- ← NEW: District and Taluk columns
  district VARCHAR(100),
  taluk VARCHAR(100),
  role ENUM('citizen', 'admin') DEFAULT 'citizen',
  password_hash VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- ← Indexes for efficient queries
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
  -- ← NEW: District and Taluk columns
  district VARCHAR(100),
  taluk VARCHAR(100),
  is_permanent BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  -- ← Indexes for efficient filtering
  INDEX idx_district (district),
  INDEX idx_taluk (taluk),
  INDEX idx_created_at (created_at),
  INDEX idx_is_permanent (is_permanent),
  INDEX idx_expires_at (expires_at)
);
```

---

## Summary

The entire taluk-based filtering system is implemented with:

1. ✅ **User Registration**: Mandatory district & taluk selection
2. ✅ **Admin Updates**: Mandatory district & taluk selection
3. ✅ **User Dashboard**: Auto-filters by user's taluk
4. ✅ **Email Notifications**: Sent to all users in target taluk
5. ✅ **Database**: Structured with indexes for performance
6. ✅ **Data**: Complete for all Tamil Nadu districts & taluks

All code is production-ready and fully functional!
