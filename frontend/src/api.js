import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const PUBLIC_PATHS = ['/login', '/pending-approval', '/forgot-password', '/reset-password'];

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const path = window.location.pathname;
    const isPublic = PUBLIC_PATHS.some(p => path.startsWith(p));
    if (err.response?.status === 401 && !isPublic) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
