import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vf_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Public API
export const fetchPublicItems = (category = '') =>
  api.get(`/items${category ? `?category=${category}` : ''}`).then(r => r.data);

// Auth API
export const loginAdmin  = (username, password) =>
  api.post('/auth/login', { username, password }).then(r => r.data);

export const verifyToken = () =>
  api.get('/auth/verify').then(r => r.data);

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
