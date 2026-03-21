import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kdm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('kdm_token');
      localStorage.removeItem('kdm_user');
    }
    return Promise.reject(error);
  }
);

// ---- Auth ----
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// ---- Users ----
export const usersAPI = {
  getById: (id) => api.get(`/users/${id}`),
  getByUsername: (username) => api.get(`/users/username/${username}`),
  updateProfile: (data) => api.put('/users/me', data),
  toggleFollow: (id) => api.post(`/users/${id}/follow`),
  getFollowers: (id, page = 1) => api.get(`/users/${id}/followers?page=${page}`),
  getFollowing: (id, page = 1) => api.get(`/users/${id}/following?page=${page}`),
};

// ---- Videos ----
export const videosAPI = {
  getFeed: (page = 1, limit = 10) => api.get(`/videos/feed?page=${page}&limit=${limit}`),
  getFollowingFeed: (page = 1, limit = 10) => api.get(`/videos/following?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/videos/${id}`),
  create: (formData) => api.post('/videos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/videos/${id}`),
  toggleLike: (id) => api.post(`/videos/${id}/like`),
  toggleBookmark: (id) => api.post(`/videos/${id}/bookmark`),
  recordView: (id) => api.post(`/videos/${id}/view`),
  getComments: (id, page = 1) => api.get(`/videos/${id}/comments?page=${page}`),
  createComment: (id, text) => api.post(`/videos/${id}/comments`, { text }),
};

// ---- Discover ----
export const discoverAPI = {
  getTrending: () => api.get('/discover/trending'),
  getCreators: (limit = 10) => api.get(`/discover/creators?limit=${limit}`),
  search: (q, type = 'all') => api.get(`/search?q=${encodeURIComponent(q)}&type=${type}`),
};

// ---- Notifications ----
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
};

export default api;
