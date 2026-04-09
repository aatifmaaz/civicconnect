const nodemailer = require('nodemailer');

const isConfiguredValue = (value) => {
  if (!value) return false;
  const normalized = String(value).trim().toLowerCase();
  return normalized !== 'your_email@gmail.com' && normalized !== 'your_app_password';
};

const createTransporter = () => {
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    isConfiguredValue(smtpUser) &&
    isConfiguredValue(smtpPassword)
  ) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });
  }

  return {
    sendMail: async (options) => {
      console.warn('[DEV SMTP] Email simulated because no valid SMTP provider credentials are configured.');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Text: ${options.text || options.html}`);
      return true;
    }
  };
};

const sendEmail = async (to, subject, message) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"Civic Connect Auto-Mailer" <${process.env.SMTP_USER || 'no-reply@civicconnect.mock'}>`,
      to,
      subject,
      html: message,
    };
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

const sendStatusUpdateEmail = async (toEmail, userName, complaintTitle, newStatus, adminNotes = '') => {
  if (!toEmail) return false;

  const subject = 'Complaint Status Update';
  const municipalityName = 'Civic Municipality HQ';

  let extraMessage = '';
  if ((newStatus === 'Rejected' || newStatus === 'On Hold') && adminNotes) {
    extraMessage = `<p><strong>Reason:</strong> ${adminNotes}</p>`;
  } else if (newStatus === 'Resolved') {
    extraMessage = '<p><strong>Your issue has been resolved. Please verify.</strong></p>';
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
      <p>Hello ${userName || 'Resident'},</p>
      <p>Your complaint titled "<strong>${complaintTitle}</strong>" has been updated.</p>
      <p>New Status: <strong>${newStatus}</strong></p>
      ${extraMessage}
      <br/>
      <p>Thank you for helping improve your city.</p>
      <p>
        Smart Civic System<br/>
        <em>${municipalityName}</em>
      </p>
    </div>
  `;

  return sendEmail(toEmail, subject, htmlContent);
};

const sendMunicipalityUpdateEmail = async (toEmail, userName, announcement) => {
  if (!toEmail) return false;

  const subject = `Municipality Update: ${announcement.title}`;
  const visibilityText = announcement.is_permanent
    ? 'This is a permanent municipal update and will remain visible until it is removed manually.'
    : `This update will remain visible until ${new Date(announcement.expires_at).toLocaleString()}.`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
      <p>Hello ${userName || 'Resident'},</p>
      <p>Your municipality has published a new public update.</p>
      <p><strong>${announcement.title}</strong></p>
      <p>${announcement.content}</p>
      <p>${visibilityText}</p>
      <br/>
      <p>You can also view this update inside your Civic Connect dashboard after logging in.</p>
      <p>Civic Connect Municipality Desk</p>
    </div>
  `;

  return sendEmail(toEmail, subject, htmlContent);
};

const sendComplaintConfirmationEmail = async (toEmail, userName, complaintTitle, trackingId, complaintAddress = '') => {
  if (!toEmail) return false;

  const subject = `Complaint Confirmation - Tracking ID: ${trackingId}`;
  const municipalityName = 'Civic Municipality HQ';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
      <p>Hello ${userName || 'Resident'},</p>
      <p>Thank you for submitting your complaint to Civic Connect. We have received your report.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Complaint Details:</strong></p>
        <p><strong>Title:</strong> ${complaintTitle}</p>
        <p><strong>Tracking ID:</strong> ${trackingId}</p>
        ${complaintAddress ? `<p><strong>Location:</strong> ${complaintAddress}</p>` : ''}
        <p><strong>Status:</strong> <span style="color: #ff9800;">Pending Review</span></p>
      </div>
      
      <p>Your complaint has been logged in our system and will be reviewed by our municipal team shortly. You can track the status of your complaint using the tracking ID above.</p>
      
      <p>You will receive email updates whenever there is any change in the status of your complaint.</p>
      
      <br/>
      <p>Thank you for helping improve your city!</p>
      <p>
        Smart Civic System<br/>
        <em>${municipalityName}</em>
      </p>
    </div>
  `;

  return sendEmail(toEmail, subject, htmlContent);
};

const sendComplaintAssignmentEmail = async (toEmail, assigneeName, complaintTitle, trackingId, complaintDetails = {}) => {
  if (!toEmail) return false;

  const subject = `New Complaint Assignment - ${trackingId}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
      <p>Hello ${assigneeName || 'Administrator'},</p>
      <p>A new complaint has been assigned to you for review and action.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Complaint Details:</strong></p>
        <p><strong>Title:</strong> ${complaintTitle}</p>
        <p><strong>Tracking ID:</strong> ${trackingId}</p>
        ${complaintDetails.category ? `<p><strong>Category:</strong> ${complaintDetails.category}</p>` : ''}
        ${complaintDetails.priority ? `<p><strong>Priority:</strong> <span style="color: ${complaintDetails.priority === 'high' ? '#d32f2f' : complaintDetails.priority === 'medium' ? '#ff9800' : '#388e3c'};">${complaintDetails.priority.toUpperCase()}</span></p>` : ''}
        ${complaintDetails.submitterName ? `<p><strong>Submitted by:</strong> ${complaintDetails.submitterName}</p>` : ''}
        ${complaintDetails.address ? `<p><strong>Location:</strong> ${complaintDetails.address}</p>` : ''}
      </div>
      
      <p>Please review the complaint details in your Admin Dashboard and take necessary action. Update the status and add notes as you progress on resolving this issue.</p>
      
      <p style="margin-top: 20px;">
        <strong>Next Steps:</strong><br/>
        1. Review the complaint details<br/>
        2. Assess the priority and feasibility<br/>
        3. Update the status to "In Progress" when work begins<br/>
        4. Notify the complainant of any updates<br/>
        5. Mark as "Resolved" when completed
      </p>
      
      <br/>
      <p>
        Civic Connect Administration System<br/>
        <em>Municipal Command Center</em>
      </p>
    </div>
  `;

  return sendEmail(toEmail, subject, htmlContent);
};

const sendAssignmentNotificationEmail = async (toEmail, residentName, complaintTitle, trackingId, assigneeName = '') => {
  if (!toEmail) return false;

  const subject = `Complaint Assigned to Team - ${trackingId}`;
  const municipalityName = 'Civic Municipality HQ';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
      <p>Hello ${residentName || 'Resident'},</p>
      <p>Great news! Your complaint has been assigned to our team for processing.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Complaint Details:</strong></p>
        <p><strong>Title:</strong> ${complaintTitle}</p>
        <p><strong>Tracking ID:</strong> ${trackingId}</p>
        ${assigneeName ? `<p><strong>Assigned to:</strong> ${assigneeName}</p>` : ''}
        <p><strong>Status:</strong> <span style="color: #4caf50;">Assigned</span></p>
      </div>
      
      <p>Our dedicated team member will now work on resolving your complaint. You will receive updates on the progress via email and in your dashboard.</p>
      
      <br/>
      <p>Thank you for your patience!</p>
      <p>
        Smart Civic System<br/>
        <em>${municipalityName}</em>
      </p>
    </div>
  `;

  return sendEmail(toEmail, subject, htmlContent);
};

const sendPasswordResetOtpEmail = async (toEmail, userName, otpCode, expiresAt) => {
  if (!toEmail) return false;

  const subject = 'Password Reset OTP - Civic Connect';
  const expiryText = expiresAt ? `This code expires at ${new Date(expiresAt).toLocaleString()}.` : 'This code expires shortly.';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
      <p>Hello ${userName || 'Resident'},</p>
      <p>We received a request to reset your Civic Connect password.</p>
      <div style="background-color: #f5f5f5; padding: 14px 18px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0; font-size: 18px;"><strong>Your OTP:</strong> ${otpCode}</p>
      </div>
      <p>${expiryText}</p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <br/>
      <p>Smart Civic System</p>
    </div>
  `;

  return sendEmail(toEmail, subject, htmlContent);
};

module.exports = {
  sendEmail,
  sendStatusUpdateEmail,
  sendMunicipalityUpdateEmail,
  sendComplaintConfirmationEmail,
  sendComplaintAssignmentEmail,
  sendAssignmentNotificationEmail,
  sendPasswordResetOtpEmail
};
