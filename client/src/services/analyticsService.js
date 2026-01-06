/**
 * Analytics Service
 * Sprint 11-12: API calls for advanced analytics
 */

import axios from 'axios';

const API_URL = '/api/analytics';

// Get dashboard analytics
const getDashboardAnalytics = async () => {
  const response = await axios.get(`${API_URL}/dashboard`);
  return response.data;
};

// Get spending trends
const getSpendingTrends = async (params = {}) => {
  const response = await axios.get(`${API_URL}/spending-trends`, { params });
  return response.data;
};

// Get income vs expense analysis
const getIncomeExpenseAnalysis = async (months = 12) => {
  const response = await axios.get(`${API_URL}/income-expense`, { 
    params: { months } 
  });
  return response.data;
};

// Get net worth history
const getNetWorthHistory = async (months = 12) => {
  const response = await axios.get(`${API_URL}/net-worth`, { 
    params: { months } 
  });
  return response.data;
};

// Record net worth snapshot
const recordNetWorthSnapshot = async () => {
  const response = await axios.post(`${API_URL}/net-worth/snapshot`);
  return response.data;
};

// Get financial health history
const getHealthHistory = async (months = 12) => {
  const response = await axios.get(`${API_URL}/health-history`, { 
    params: { months } 
  });
  return response.data;
};

// Record health snapshot
const recordHealthSnapshot = async () => {
  const response = await axios.post(`${API_URL}/health/snapshot`);
  return response.data;
};

// Get cross-module insights
const getCrossModuleInsights = async () => {
  const response = await axios.get(`${API_URL}/insights`);
  return response.data;
};

const analyticsService = {
  getDashboardAnalytics,
  getSpendingTrends,
  getIncomeExpenseAnalysis,
  getNetWorthHistory,
  recordNetWorthSnapshot,
  getHealthHistory,
  recordHealthSnapshot,
  getCrossModuleInsights
};

export default analyticsService;
