import axios from 'axios';

const API_URL = '/api/market';

const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
};

// Price data
export const getQuote = async (symbol) => {
  const response = await axios.get(`${API_URL}/quote/${symbol}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getBatchQuotes = async (symbols) => {
  const response = await axios.post(`${API_URL}/quotes`, { symbols }, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getHistory = async (symbol, period = 'compact') => {
  const response = await axios.get(`${API_URL}/history/${symbol}`, {
    params: { period },
    headers: getAuthHeader()
  });
  return response.data;
};

// Asset discovery
export const searchAssets = async (query) => {
  const response = await axios.get(`${API_URL}/search`, {
    params: { q: query },
    headers: getAuthHeader()
  });
  return response.data;
};

export const getAllAssets = async (filters = {}) => {
  const response = await axios.get(`${API_URL}/assets`, {
    params: filters,
    headers: getAuthHeader()
  });
  return response.data;
};

export const getAssetDetails = async (symbol) => {
  const response = await axios.get(`${API_URL}/asset/${symbol}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Portfolio integration
export const getPortfolioLive = async (portfolioId) => {
  const response = await axios.get(`${API_URL}/portfolio/${portfolioId}/live`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getPortfolioPerformance = async (portfolioId, period = '1M') => {
  const response = await axios.get(`${API_URL}/portfolio/${portfolioId}/performance`, {
    params: { period },
    headers: getAuthHeader()
  });
  return response.data;
};

export const getPortfolioAllocation = async (portfolioId) => {
  const response = await axios.get(`${API_URL}/portfolio/${portfolioId}/allocation`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const createSnapshot = async (portfolioId) => {
  const response = await axios.post(`${API_URL}/portfolio/${portfolioId}/snapshot`, {}, {
    headers: getAuthHeader()
  });
  return response.data;
};

export default {
  getQuote,
  getBatchQuotes,
  getHistory,
  searchAssets,
  getAllAssets,
  getAssetDetails,
  getPortfolioLive,
  getPortfolioPerformance,
  getPortfolioAllocation,
  createSnapshot
};