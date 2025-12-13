import axios from 'axios';

const API_URL = '/api/transactions';

const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
};

const getTransactions = async (filters = {}) => {
  const response = await axios.get(API_URL, {
    headers: getAuthHeader(),
    params: filters
  });
  return response.data;
};

const getTransaction = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

const getStats = async (filters = {}) => {
  const response = await axios.get(`${API_URL}/stats`, {
    headers: getAuthHeader(),
    params: filters
  });
  return response.data;
};

const createTransaction = async (transactionData) => {
  const response = await axios.post(API_URL, transactionData, {
    headers: getAuthHeader()
  });
  return response.data;
};

const updateTransaction = async (id, transactionData) => {
  const response = await axios.put(`${API_URL}/${id}`, transactionData, {
    headers: getAuthHeader()
  });
  return response.data;
};

const deleteTransaction = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

const transactionService = {
  getTransactions,
  getTransaction,
  getStats,
  createTransaction,
  updateTransaction,
  deleteTransaction
};

export default transactionService;