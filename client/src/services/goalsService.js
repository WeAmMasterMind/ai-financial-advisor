/**
 * Goals Service
 * Sprint 11-12: API calls for financial goals
 */

import axios from 'axios';

const API_URL = '/api/goals';

const getAuthConfig = () => {
  const token = localStorage.getItem('accessToken');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export const getGoals = async (status = 'active') => {
  const response = await axios.get(API_URL, {
    params: { status },
    ...getAuthConfig()
  });
  return response.data;
};

export const getGoalById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`, getAuthConfig());
  return response.data;
};

export const createGoal = async (goalData) => {
  const response = await axios.post(API_URL, goalData, getAuthConfig());
  return response.data;
};

export const updateGoal = async (id, goalData) => {
  const response = await axios.put(`${API_URL}/${id}`, goalData, getAuthConfig());
  return response.data;
};

export const deleteGoal = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getAuthConfig());
  return response.data;
};

export const getGoalsSummary = async () => {
  const response = await axios.get(`${API_URL}/summary`, getAuthConfig());
  return response.data;
};

export const addContribution = async (goalId, data) => {
  const response = await axios.post(`${API_URL}/${goalId}/contributions`, data, getAuthConfig());
  return response.data;
};

export const getGoalProjection = async (goalId, monthlyAmount) => {
  const response = await axios.get(`${API_URL}/${goalId}/projection`, {
    params: { monthlyAmount },
    ...getAuthConfig()
  });
  return response.data;
};

export default {
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  getGoalsSummary,
  addContribution,
  getGoalProjection
};
