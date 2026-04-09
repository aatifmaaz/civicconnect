/**
 * Utility Functions
 */

/**
 * Format date to readable format
 */
export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format date with time
 */
export const formatDatetime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get status badge color
 */
export const getStatusColor = (status) => {
  const colors = {
    pending: 'info',
    in_progress: 'warning',
    resolved: 'success',
    closed: 'danger',
  };
  return colors[status] || 'info';
};

/**
 * Get priority badge color
 */
export const getPriorityColor = (priority) => {
  const colors = {
    low: 'info',
    medium: 'warning',
    high: 'danger',
    critical: 'danger',
  };
  return colors[priority] || 'warning';
};

/**
 * Validate phone number
 */
export const validatePhone = (phone) => {
  return /^[0-9]{10}$/.test(phone);
};

/**
 * Validate OTP
 */
export const validateOTP = (otp) => {
  return /^[0-9]{6}$/.test(otp);
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
