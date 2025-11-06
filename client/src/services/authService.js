import axios from 'axios';

const API_URL = '/api/auth';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/refresh-token`, {
            refreshToken,
          });

          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Register user
const register = async (userData) => {
  const response = await axiosInstance.post(`${API_URL}/register`, userData);
  return response.data;
};

// Login user
const login = async (userData) => {
  const response = await axiosInstance.post(`${API_URL}/login`, userData);
  return response.data;
};

// Logout user
const logout = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  try {
    await axiosInstance.post(`${API_URL}/logout`, { refreshToken });
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// Get current user
const getMe = async () => {
  const response = await axiosInstance.get(`${API_URL}/me`);
  return response.data;
};

// Refresh token
const refreshToken = async (token) => {
  const response = await axios.post(`${API_URL}/refresh-token`, {
    refreshToken: token,
  });
  return response.data;
};

const authService = {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  axiosInstance, // Export for use in other services
};

export default authService;