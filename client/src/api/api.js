import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://vf-smart-list.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach user or admin JWT to every request automatically
api.interceptors.request.use((config) => {
  const userToken  = localStorage.getItem('vf_user_token');
  const adminToken = localStorage.getItem('vf_admin_token');
  const token = userToken || adminToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Public API
export const fetchPublicItems = (category = '') =>
  api.get(`/items${category ? `?category=${category}` : ''}`).then(r => r.data);

// Admin Auth API
export const loginAdmin  = (username, password) =>
  api.post('/auth/login', { username, password }).then(r => r.data);

export const verifyToken = () =>
  api.get('/auth/verify').then(r => r.data);

// User Auth API (Shoppers)
export const userRegister = (username, email, password) =>
  api.post('/user-auth/register', { username, email, password }).then(r => r.data);

export const userLogin = (usernameOrEmail, password) =>
  api.post('/user-auth/login', { usernameOrEmail, password }).then(r => r.data);

export const getUserProfile = () =>
  api.get('/user-auth/me').then(r => r.data);

// Shopping History API
export const saveHistory = (items, title) =>
  api.post('/history', { items, title }).then(r => r.data);

export const fetchHistory = () =>
  api.get('/history').then(r => r.data);

export const deleteHistory = (id) =>
  api.delete(`/history/${id}`).then(r => r.data);

// Admin Items API
export const fetchAllItems = (params = {}) =>
  api.get('/items/admin/items', { params }).then(r => r.data);

export const fetchStats = () =>
  api.get('/items/admin/stats').then(r => r.data);

export const createItem = (data) =>
  api.post('/items/admin/items', data).then(r => r.data);

export const updateItem = (id, data) =>
  api.put(`/items/admin/items/${id}`, data).then(r => r.data);

export const deleteItem = (id) =>
  api.delete(`/items/admin/items/${id}`).then(r => r.data);

export const toggleItem = (id) =>
  api.patch(`/items/admin/items/${id}/toggle`).then(r => r.data);

export default api;

