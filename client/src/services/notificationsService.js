/**
 * Notifications Service
 * Sprint 11-12: API calls for notifications
 */

import axios from 'axios';

const API_URL = '/api/notifications';

// Get all notifications
const getNotifications = async (params = {}) => {
  const response = await axios.get(API_URL, { params });
  return response.data;
};

// Get single notification
const getNotification = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

// Mark notification as read
const markAsRead = async (id) => {
  const response = await axios.put(`${API_URL}/${id}/read`);
  return response.data;
};

// Mark all notifications as read
const markAllAsRead = async () => {
  const response = await axios.put(`${API_URL}/read-all`);
  return response.data;
};

// Delete notification
const deleteNotification = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};

// Delete all read notifications
const deleteAllRead = async () => {
  const response = await axios.delete(`${API_URL}/read`);
  return response.data;
};

// Get notification preferences
const getPreferences = async () => {
  const response = await axios.get(`${API_URL}/preferences`);
  return response.data;
};

// Update notification preferences
const updatePreferences = async (preferences) => {
  const response = await axios.put(`${API_URL}/preferences`, preferences);
  return response.data;
};

// Generate pending notifications
const generateNotifications = async () => {
  const response = await axios.post(`${API_URL}/generate`);
  return response.data;
};

// Get notification counts
const getNotificationCounts = async () => {
  const response = await axios.get(`${API_URL}/counts`);
  return response.data;
};

const notificationsService = {
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  getPreferences,
  updatePreferences,
  generateNotifications,
  getNotificationCounts
};

export default notificationsService;
