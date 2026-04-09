/**
 * API Service Utility
 * Handles all API calls to backend
 */

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('user');
      // Redirect to login could be handled here
    }
    return Promise.reject(error);
  }
);

/**
 * Authentication API calls
 */
export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  verifyRegister: (data) => apiClient.post('/auth/verify-register', data),
  loginRequest: (data) => apiClient.post('/auth/login-request', data),
  loginVerify: (data) => apiClient.post('/auth/login-verify', data),
  requestPasswordReset: (data) => apiClient.post('/auth/forgot-password/request', data),
  verifyPasswordReset: (data) => apiClient.post('/auth/forgot-password/verify', data),
  resetPassword: (data) => apiClient.post('/auth/forgot-password/reset', data),
  getProfile: () => apiClient.get('/auth/profile'),
};

/**
 * Complaint API calls
 */
export const complaintAPI = {
  create: (data) => apiClient.post('/complaints/create', data),
  getMyComplaints: (page = 1, limit = 10) => 
    apiClient.get('/complaints/my-complaints', { params: { page, limit } }),
  getById: (id) => apiClient.get(`/complaints/${id}`),
  getLogs: (id) => apiClient.get(`/complaints/${id}/logs`),
  updateStatus: (id, data) => apiClient.put(`/complaints/${id}/status`, data),
  search: (filters = {}, page = 1, limit = 10) =>
    apiClient.get('/complaints', { params: { ...filters, page, limit } }),
};

/**
 * Notification API calls
 */
export const notificationAPI = {
  getAll: (page = 1, limit = 20) =>
    apiClient.get('/notifications', { params: { page, limit } }),
  markAsRead: (id) => apiClient.put(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.post('/notifications/mark-all/read'),
  getUnreadCount: () => apiClient.get('/notifications/unread-count/fetch'),
};

/**
 * Admin API calls
 */
export const adminAPI = {
  getDashboard: () => apiClient.get('/admin/dashboard'),
  getAllComplaints: (page = 1, limit = 20) =>
    apiClient.get('/complaints', { params: { page, limit } }),
  assignComplaint: (id, data) => apiClient.post(`/complaints/${id}/assign`, data),
  getStats: (startDate, endDate) =>
    apiClient.get('/complaints/stats/analytics', { params: { startDate, endDate } }),
  getAnnouncements: () => apiClient.get('/admin/announcements'),
  createAnnouncement: (data) => apiClient.post('/admin/announcements', data),
  deleteAnnouncement: (id) => apiClient.delete(`/admin/announcements/${id}`),
};

export const announcementAPI = {
  getActive: (taluk = null) => apiClient.get('/announcements', { params: taluk ? { taluk } : {} }),
};

export default apiClient;
