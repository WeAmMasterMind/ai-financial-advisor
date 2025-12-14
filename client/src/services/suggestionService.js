import axios from 'axios';

const API_URL = '/api/suggestions';

const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
};

export const generateSuggestions = async () => {
  const response = await axios.post(`${API_URL}/generate`, {}, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getSuggestions = async (status = 'pending') => {
  const response = await axios.get(API_URL, {
    params: { status },
    headers: getAuthHeader()
  });
  return response.data;
};

export const updateSuggestion = async (id, status) => {
  const response = await axios.patch(`${API_URL}/${id}`, { status }, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getSuggestionHistory = async () => {
  const response = await axios.get(`${API_URL}/history`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export default {
  generateSuggestions,
  getSuggestions,
  updateSuggestion,
  getSuggestionHistory
};