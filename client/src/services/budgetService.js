import axios from 'axios';

const API_URL = '/api/budgets';

const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
};

// Budget operations
const getBudgets = async (year) => {
  const response = await axios.get(API_URL, {
    headers: getAuthHeader(),
    params: { year }
  });
  return response.data;
};

const getCurrentBudget = async () => {
  const response = await axios.get(`${API_URL}/current`, {
    headers: getAuthHeader()
  });
  return response.data;
};

const getBudgetSummary = async () => {
  const response = await axios.get(`${API_URL}/summary`, {
    headers: getAuthHeader()
  });
  return response.data;
};

const getBudget = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

const createBudget = async (budgetData) => {
  const response = await axios.post(API_URL, budgetData, {
    headers: getAuthHeader()
  });
  return response.data;
};

const updateBudget = async (id, budgetData) => {
  const response = await axios.put(`${API_URL}/${id}`, budgetData, {
    headers: getAuthHeader()
  });
  return response.data;
};

const deleteBudget = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Category operations
const getCategories = async () => {
  const response = await axios.get(`${API_URL}/categories/all`, {
    headers: getAuthHeader()
  });
  return response.data;
};

const createCategory = async (categoryData) => {
  const response = await axios.post(`${API_URL}/categories`, categoryData, {
    headers: getAuthHeader()
  });
  return response.data;
};

const updateCategory = async (id, categoryData) => {
  const response = await axios.put(`${API_URL}/categories/${id}`, categoryData, {
    headers: getAuthHeader()
  });
  return response.data;
};

const deleteCategory = async (id) => {
  const response = await axios.delete(`${API_URL}/categories/${id}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

const budgetService = {
  getBudgets,
  getCurrentBudget,
  getBudgetSummary,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};

export default budgetService;