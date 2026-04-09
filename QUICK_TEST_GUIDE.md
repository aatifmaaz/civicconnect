# Quick Testing Guide

## Feature 1: Forget Password with OTP

### Step-by-Step Testing

1. **Start the application**
   ```bash
   cd backend
   npm start
   
   cd frontend
   npm run dev
   ```

2. **Test the forgot password flow**
   - Open browser to `http://localhost:3000/forgot-password`
   - Enter a valid registered user's email
   - Click "Send OTP"
   - Check backend console for OTP (since SMTP is mocked)
   - Enter the OTP from console
   - Enter new password (at least 6 characters)
   - Confirm password
   - Click "Reset Password"
   - You should be redirected to login page
   - Try logging in with the new password

3. **OTP Expiry Test**
   - Edit `backend/src/utils/otp.js`
   - Change `calculateOTPExpiry(10)` to `calculateOTPExpiry(0.01)` (tests 1 second expiry)
   - Request OTP
   - Wait a few seconds
   - Try entering OTP - should get "Invalid or expired OTP" error

### Configuration for Real Email

**Option 1: Gmail SMTP**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
```

**Option 2: SendGrid**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
```

**Option 3: AWS SES**
```env
SMTP_HOST=email-smtp.region.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASSWORD=your_smtp_password
```

---

## Feature 2: Complaint Status Update Emails

### Testing in Admin Dashboard

1. **Create a complaint** (as citizen user)
   - Go to complaint submission page
   - Fill in complaint details
   - Submit
   - You'll receive confirmation email (check console if mock mode)

2. **Update complaint status** (as admin user)
   - Login as admin
   - Go to admin dashboard
   - Find the complaint
   - Click status dropdown
   - Select new status (e.g., "In Progress")
   - Add notes (optional)
   - Click "Update Status"
   - **Email automatically sent to citizen** ✅

3. **Check console logs**
   ```
   [DEV SMTP] Email simulated...
   To: user@example.com
   Subject: Complaint Status Update
   Text: <HTML content of email>
   ```

### Valid Status Transitions

```
Pending → Assigned, Under Review, Rejected
Assigned → Under Review, On Hold, Rejected
Under Review → In Progress, On Hold, Rejected
In Progress → Resolved, On Hold, Rejected
On Hold → In Progress, Rejected
Rejected → Pending
Resolved → Reopened
```

### Email Content Examples

**When Status = "In Progress"**
```
Hello [User Name],

Your complaint titled "[Complaint Title]" has been updated.

New Status: In Progress

Thank you for helping improve your city.
```

**When Status = "Resolved"**
```
Hello [User Name],

Your complaint titled "[Complaint Title]" has been updated.

New Status: Resolved

Your issue has been resolved. Please verify.

Thank you for helping improve your city.
```

**When Status = "Rejected" with notes**
```
Hello [User Name],

Your complaint titled "[Complaint Title]" has been updated.

New Status: Rejected

Reason: [Admin notes about why rejected]

Thank you for helping improve your city.
```

---

## API Testing with Curl/Postman

### Get OTP for Password Reset
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password/request \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

# Response:
# {"success":true,"message":"OTP sent to your email"}
```

### Verify OTP
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","otp":"123456"}'

# Response:
# {"success":true,"message":"OTP verified"}
```

### Reset Password
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password/reset \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "otp":"123456",
    "newPassword":"newpass123",
    "confirmPassword":"newpass123"
  }'

# Response:
# {"success":true,"message":"Password reset successfully"}
```

### Update Complaint Status
```bash
curl -X PUT http://localhost:5000/api/complaints/123/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "status":"In Progress",
    "notes":"Started investigating..."
  }'

# Response:
# {"success":true,"message":"Complaint status updated successfully"}
```

---

## Debugging Tips

### OTP not working?
1. Check that user exists in database
2. Verify `.env` has `OTP_EXPIRY=10` or higher
3. Check backend console for OTP value
4. Verify OTP format (6 digits)

### Email not sending?
1. Check backend console - should show "Email simulated" message
2. Configure real SMTP provider credentials
3. Use SendGrid or AWS SES (more reliable than Gmail)
4. Check internet connection and firewall

### Status email not received?
1. Verify user email is correct in database
2. Check user role is 'admin' or 'citizen'
3. Verify complaint user_id matches
4. Check backend console for email log
5. Valid status must be one of the allowed transitions

### Password reset link not working?
1. Ensure backend is running (`npm start`)
2. Check NEXT_PUBLIC_API_URL in frontend .env
3. Verify API calls in browser console (F12 → Network tab)
4. Check for CORS errors in backend logs

---

## Database Verification

### Check if OTP stored correctly
```sql
SELECT id, email, otp, otp_expires_at FROM users WHERE email='user@example.com';
```

### Check complaint status changes
```sql
SELECT * FROM activity_logs WHERE complaint_id=123 ORDER BY created_at DESC;
```

### Check notifications
```sql
SELECT * FROM notifications WHERE user_id=1 ORDER BY created_at DESC;
```

---

## Production Checklist

- [ ] Configure real SMTP provider in `.env`
- [ ] Set `OTP_EXPIRY` to appropriate time (suggested: 10 minutes)
- [ ] Set `JWT_SECRET` to a strong random value
- [ ] Test email delivery before going live
- [ ] Verify SSL certificate for SMTP (if using port 465)
- [ ] Set up email bounce handling
- [ ] Monitor email sending logs
- [ ] Have backup SMTP provider configured
