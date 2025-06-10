import axios from 'axios';
const isProd = process.env.NODE_ENV === 'production';

const axiosInstance = axios.create({
  baseURL: isProd ? `http://3.25.85.247:3000/api` : 'http://3.25.85.247:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance; 