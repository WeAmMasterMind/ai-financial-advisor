import axios from 'axios';

const API_URL = '/api/users';

const getProfile = async () => {
  const token = localStorage.getItem('accessToken');
  const response = await axios.get(`${API_URL}/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response;
};

const updateProfile = async (profileData) => {
  const token = localStorage.getItem('accessToken');
  const response = await axios.put(`${API_URL}/profile`, profileData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response;
};

const getDashboard = async () => {
  const token = localStorage.getItem('accessToken');
  const response = await axios.get(`${API_URL}/dashboard`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response;
};

const userService = {
  getProfile,
  updateProfile,
  getDashboard
};

export default userService;