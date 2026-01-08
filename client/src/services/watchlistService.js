import axios from 'axios';

const API_URL = '/api/watchlist';

const getAuthConfig = () => {
  const token = localStorage.getItem('accessToken');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export const getWatchlist = async () => {
  const response = await axios.get(API_URL, getAuthConfig());
  return response.data;
};

export const addToWatchlist = async (symbol, notes, targetBuyPrice) => {
  const response = await axios.post(API_URL, { symbol, notes, targetBuyPrice }, getAuthConfig());
  return response.data;
};

export const removeFromWatchlist = async (symbol) => {
  const response = await axios.delete(`${API_URL}/${symbol}`, getAuthConfig());
  return response.data;
};

export const updateWatchlistItem = async (symbol, data) => {
  const response = await axios.patch(`${API_URL}/${symbol}`, data, getAuthConfig());
  return response.data;
};

export default {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  updateWatchlistItem
};