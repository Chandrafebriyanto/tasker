// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:1337/api',
});

// Request interceptor — attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Only auto-logout if we had a token (avoid redirect loop on login page)
      const token = localStorage.getItem('jwt');
      if (token) {
        localStorage.removeItem('jwt');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;