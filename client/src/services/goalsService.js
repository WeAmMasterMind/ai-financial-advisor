/**
 * Goals Service
 * Sprint 11-12: API calls for financial goals
 */

import axios from 'axios';

const API_URL = '/api/goals';

// Get all goals
const getGoals = async (params = {}) => {
  const response = await axios.get(API_URL, { params });
  return response.data;
};

// Get single goal with details
const getGoal = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

// Create new goal
const createGoal = async (goalData) => {
  const response = await axios.post(API_URL, goalData);
  return response.data;
};

// Update goal
const updateGoal = async (id, goalData) => {
  const response = await axios.put(`${API_URL}/${id}`, goalData);
  return response.data;
};

// Delete goal
const deleteGoal = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};

// Add contribution to goal
const addContribution = async (goalId, contributionData) => {
  const response = await axios.post(`${API_URL}/${goalId}/contributions`, contributionData);
  return response.data;
};

// Get goals summary
const getGoalsSummary = async () => {
  const response = await axios.get(`${API_URL}/summary`);
  return response.data;
};

// Get goal projection
const getGoalProjection = async (goalId, monthlyAmount) => {
  const response = await axios.get(`${API_URL}/${goalId}/projection`, {
    params: { monthlyAmount }
  });
  return response.data;
};

const goalsService = {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  addContribution,
  getGoalsSummary,
  getGoalProjection
};

export default goalsService;
