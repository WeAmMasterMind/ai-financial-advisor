/**
 * Dashboard Service
 * Frontend API client for dashboard endpoints
 */

import axios from 'axios';

const API_URL = '/api/dashboard';

// Create axios instance with auth interceptor
const api = axios.create();

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Get full dashboard summary
const getDashboardSummary = async () => {
  const response = await api.get(API_URL);
  return response.data;
};

// Get quick stats (lightweight)
const getQuickStats = async () => {
  const response = await api.get(`${API_URL}/quick-stats`);
  return response.data;
};

const dashboardService = {
  getDashboardSummary,
  getQuickStats
};

export default dashboardService;