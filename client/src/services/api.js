import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          if (window.location.pathname !== '/login') {
            toast.error('Session expired. Please log in again.');
            window.location.href = '/login';
          }
          break;
        
        case 403:
          toast.error('Access forbidden. You do not have permission for this action.');
          break;
        
        case 404:
          toast.error('Resource not found.');
          break;
        
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
        
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        
        default:
          if (data?.message) {
            toast.error(data.message);
          } else {
            toast.error('An unexpected error occurred.');
          }
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  refreshToken: () => api.post('/auth/refresh-token'),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
};

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
  uploadAvatar: (formData) => api.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteAccount: () => api.delete('/users/account'),
  getNotificationSettings: () => api.get('/users/notifications'),
  updateNotificationSettings: (settings) => api.put('/users/notifications', settings),
};

export const scanAPI = {
  startScan: (data) => api.post('/scans', data), // Fixed endpoint
  getScan: (scanId) => api.get(`/scans/${scanId}`),
  getScans: (params) => api.get('/scans', { params }),
  getScanStatus: (scanId) => api.get(`/scans/${scanId}/status`), // Added missing method
  stopScan: (scanId) => api.post(`/scans/${scanId}/cancel`), // Fixed endpoint  
  deleteScan: (scanId) => api.delete(`/scans/${scanId}`),
  getScanHistory: (params) => api.get('/scans/history', { params }),
  getScanVulnerabilities: (scanId, params) => api.get(`/scans/${scanId}/vulnerabilities`, { params }), // Added
  exportScanResults: (scanId, format) => api.get(`/scans/${scanId}/export`, {
    params: { format },
    responseType: 'blob'
  }),
};

export const threatAPI = {
  getThreats: (params) => api.get('/threats', { params }),
  getThreat: (threatId) => api.get(`/threats/${threatId}`),
  markThreatAsRead: (threatId) => api.put(`/threats/${threatId}/read`),
  dismissThreat: (threatId) => api.put(`/threats/${threatId}/dismiss`),
  getThreatStats: () => api.get('/threats/stats'),
  searchThreats: (query, filters) => api.post('/threats/search', { query, filters }),
  reportFalsePositive: (threatId, reason) => api.post(`/threats/${threatId}/false-positive`, { reason }),
};

export const reportsAPI = {
  getDashboardReport: () => api.get('/reports/dashboard'),
  getVulnerabilityReport: (reportId) => api.get(`/reports/vulnerability/${reportId}`),
  exportReports: (type, params) => api.get(`/reports/export/${type}`, {
    params,
    responseType: params?.format === 'csv' ? 'blob' : 'json'
  }),
  getSecurityScore: () => api.get('/reports/security-score'),
  getComplianceReport: () => api.get('/reports/compliance'),
  getTrendAnalysis: (params) => api.get('/reports/trends', { params }),
};

export const educationAPI = {
  getModules: () => api.get('/education/modules'),
  getModule: (moduleId) => api.get(`/education/modules/${moduleId}`),
  completeLesson: (moduleId, lessonId, answers) => 
    api.post(`/education/modules/${moduleId}/lessons/${lessonId}/complete`, { answers }),
  getProgress: () => api.get('/education/progress'),
  startPhishingSimulation: (difficulty) => 
    api.post('/education/simulate-phishing', { difficulty }),
  submitSimulationResult: (simulationId, result) => 
    api.post(`/education/simulations/${simulationId}/result`, result),
  getAchievements: () => api.get('/education/achievements'),
  getCertificates: () => api.get('/education/certificates'),
};

export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (settings) => api.put('/settings', settings),
  resetSettings: () => api.post('/settings/reset'),
  exportSettings: () => api.get('/settings/export', { responseType: 'blob' }),
  importSettings: (file) => {
    const formData = new FormData();
    formData.append('settings', file);
    return api.post('/settings/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  testEmailSettings: (emailConfig) => api.post('/settings/test-email', emailConfig),
  generateApiKey: () => api.post('/settings/api-key/generate'),
  revokeApiKey: () => api.delete('/settings/api-key'),
};

// Utility functions
export const uploadFile = (file, endpoint, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
};

export const downloadFile = async (url, filename) => {
  try {
    const response = await api.get(url, { responseType: 'blob' });
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    toast.error('Failed to download file');
    throw error;
  }
};

export default api;