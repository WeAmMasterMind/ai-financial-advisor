/**
 * Debt Service
 * API calls for debt management
 */

import axios from 'axios';

const API_URL = '/api/debts';

// Get axios instance with auth header
const getAuthConfig = () => {
  const token = localStorage.getItem('accessToken');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

/**
 * Get all debts
 */
export const getDebts = async () => {
  const response = await axios.get(API_URL, getAuthConfig());
  return response.data;
};

/**
 * Get single debt by ID
 */
export const getDebtById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`, getAuthConfig());
  return response.data;
};

/**
 * Create new debt
 */
export const createDebt = async (debtData) => {
  const response = await axios.post(API_URL, debtData, getAuthConfig());
  return response.data;
};

/**
 * Update debt
 */
export const updateDebt = async (id, debtData) => {
  const response = await axios.put(`${API_URL}/${id}`, debtData, getAuthConfig());
  return response.data;
};

/**
 * Delete debt
 */
export const deleteDebt = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getAuthConfig());
  return response.data;
};

/**
 * Get debt summary
 */
export const getDebtSummary = async () => {
  const response = await axios.get(`${API_URL}/summary`, getAuthConfig());
  return response.data;
};

/**
 * Record payment
 */
export const recordPayment = async (debtId, paymentData) => {
  const response = await axios.post(
    `${API_URL}/${debtId}/payments`, 
    paymentData, 
    getAuthConfig()
  );
  return response.data;
};

/**
 * Get payment history
 */
export const getPayments = async (debtId) => {
  const response = await axios.get(
    `${API_URL}/${debtId}/payments`, 
    getAuthConfig()
  );
  return response.data;
};

/**
 * Calculate snowball strategy
 */
export const calculateSnowball = async (monthlyExtra = 0) => {
  const response = await axios.post(
    `${API_URL}/calculate/snowball`, 
    { monthlyExtra }, 
    getAuthConfig()
  );
  return response.data;
};

/**
 * Calculate avalanche strategy
 */
export const calculateAvalanche = async (monthlyExtra = 0) => {
  const response = await axios.post(
    `${API_URL}/calculate/avalanche`, 
    { monthlyExtra }, 
    getAuthConfig()
  );
  return response.data;
};

/**
 * Compare strategies
 */
export const compareStrategies = async (monthlyExtra = 0) => {
  const response = await axios.post(
    `${API_URL}/calculate/compare`, 
    { monthlyExtra }, 
    getAuthConfig()
  );
  return response.data;
};

/**
 * Get saved strategy
 */
export const getStrategy = async () => {
  const response = await axios.get(`${API_URL}/strategy`, getAuthConfig());
  return response.data;
};

/**
 * Save strategy
 */
export const saveStrategy = async (strategyData) => {
  const response = await axios.post(
    `${API_URL}/strategy`, 
    strategyData, 
    getAuthConfig()
  );
  return response.data;
};

const debtService = {
  getDebts,
  getDebtById,
  createDebt,
  updateDebt,
  deleteDebt,
  getDebtSummary,
  recordPayment,
  getPayments,
  calculateSnowball,
  calculateAvalanche,
  compareStrategies,
  getStrategy,
  saveStrategy
};

export default debtService;