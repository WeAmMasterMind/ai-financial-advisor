/**
 * Analytics Service
 * Sprint 11-12: API calls for advanced analytics
 */

import axios from 'axios';

const API_URL = '/api/analytics';

const getAuthConfig = () => {
  const token = localStorage.getItem('accessToken');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export const getDashboardAnalytics = async () => {
  const response = await axios.get(`${API_URL}/dashboard`, getAuthConfig());
  return response.data;
};

export const getSpendingTrends = async (months = 6) => {
  const response = await axios.get(`${API_URL}/spending-trends`, {
    params: { months },
    ...getAuthConfig()
  });
  return response.data;
};

export const getIncomeExpenseAnalysis = async (months = 12) => {
  const response = await axios.get(`${API_URL}/income-expense`, {
    params: { months },
    ...getAuthConfig()
  });
  return response.data;
};

export const getCategoryBreakdown = async (period = 'month') => {
  const response = await axios.get(`${API_URL}/categories`, {
    params: { period },
    ...getAuthConfig()
  });
  return response.data;
};

export const getNetWorthHistory = async () => {
  const response = await axios.get(`${API_URL}/net-worth`, getAuthConfig());
  return response.data;
};

export const getCrossModuleInsights = async () => {
  const response = await axios.get(`${API_URL}/insights`, getAuthConfig());
  return response.data;
};

export default {
  getDashboardAnalytics,
  getSpendingTrends,
  getIncomeExpenseAnalysis,
  getCategoryBreakdown,
  getNetWorthHistory,
  getCrossModuleInsights
};
