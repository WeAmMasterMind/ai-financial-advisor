/**
 * Portfolio Service
 * API calls for portfolio management
 */

import axios from 'axios';

const API_URL = '/api/portfolios';

const getAuthConfig = () => {
  const token = localStorage.getItem('accessToken');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export const getPortfolios = async () => {
  const response = await axios.get(API_URL, getAuthConfig());
  return response.data;
};

export const getPortfolioById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`, getAuthConfig());
  return response.data;
};

export const createPortfolio = async (data) => {
  const response = await axios.post(API_URL, data, getAuthConfig());
  return response.data;
};

export const updatePortfolio = async (id, data) => {
  const response = await axios.put(`${API_URL}/${id}`, data, getAuthConfig());
  return response.data;
};

export const deletePortfolio = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getAuthConfig());
  return response.data;
};

export const addHolding = async (portfolioId, data) => {
  const response = await axios.post(`${API_URL}/${portfolioId}/holdings`, data, getAuthConfig());
  return response.data;
};

export const updateHolding = async (holdingId, data) => {
  const response = await axios.put(`${API_URL}/holdings/${holdingId}`, data, getAuthConfig());
  return response.data;
};

export const deleteHolding = async (holdingId) => {
  const response = await axios.delete(`${API_URL}/holdings/${holdingId}`, getAuthConfig());
  return response.data;
};

export const updateHoldingPrice = async (holdingId, currentPrice) => {
  const response = await axios.put(`${API_URL}/holdings/${holdingId}/price`, { current_price: currentPrice }, getAuthConfig());
  return response.data;
};

export const getAllocation = async (portfolioId) => {
  const response = await axios.get(`${API_URL}/${portfolioId}/allocation`, getAuthConfig());
  return response.data;
};

export const getRebalancePlan = async (portfolioId, threshold = 5) => {
  const response = await axios.post(`${API_URL}/${portfolioId}/rebalance`, { threshold }, getAuthConfig());
  return response.data;
};

export const getPerformance = async (portfolioId) => {
  const response = await axios.get(`${API_URL}/${portfolioId}/performance`, getAuthConfig());
  return response.data;
};

export const getRecommendedPortfolio = async () => {
  const response = await axios.get(`${API_URL}/recommended`, getAuthConfig());
  return response.data;
};

const portfolioService = {
  getPortfolios,
  getPortfolioById,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  addHolding,
  updateHolding,
  deleteHolding,
  updateHoldingPrice,
  getAllocation,
  getRebalancePlan,
  getPerformance,
  getRecommendedPortfolio
};

export default portfolioService;