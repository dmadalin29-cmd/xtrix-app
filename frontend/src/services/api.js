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
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
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
  getCommentReplies: (commentId, page = 1) => api.get(`/videos/comments/${commentId}/replies?page=${page}`),
  createCommentReply: (commentId, text) => api.post(`/videos/comments/${commentId}/replies`, { text }),
  likeComment: (commentId) => api.post(`/videos/comments/${commentId}/like`),
};

// ---- Discover ----
export const discoverAPI = {
  getTrending: () => api.get('/discover/trending'),
  getCreators: (limit = 10) => api.get(`/discover/creators?limit=${limit}`),
  search: (q, type = 'all') => api.get(`/search?q=${encodeURIComponent(q)}&type=${type}`),
  getHashtagVideos: (tag, page = 1) => api.get(`/hashtag/${encodeURIComponent(tag)}?page=${page}`),
  getAnalytics: () => api.get('/analytics'),
};

// ---- Notifications ----
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
};

// ---- Messages ----
export const messagesAPI = {
  getConversations: () => api.get('/messages/conversations'),
  createConversation: (targetUserId) => api.post(`/messages/conversations?target_user_id=${targetUserId}`),
  getMessages: (conversationId, page = 1) => api.get(`/messages/conversations/${conversationId}/messages?page=${page}`),
  sendMessage: (conversationId, text) => api.post(`/messages/conversations/${conversationId}/messages?text=${encodeURIComponent(text)}`),
};

// ---- Live Streaming ----
export const liveAPI = {
  startStream: (title, category = 'other') => api.post(`/live/start?title=${encodeURIComponent(title)}&category=${category}`),
  endStream: (streamId) => api.post(`/live/${streamId}/end`),
  getActiveStreams: () => api.get('/live/active'),
  getStream: (streamId) => api.get(`/live/${streamId}`),
  joinStream: (streamId) => api.post(`/live/${streamId}/join`),
  leaveStream: (streamId) => api.post(`/live/${streamId}/leave`),
  likeStream: (streamId) => api.post(`/live/${streamId}/like`),
  getChat: (streamId, after = '') => api.get(`/live/${streamId}/chat?after=${after}`),
  sendChat: (streamId, text) => api.post(`/live/${streamId}/chat?text=${encodeURIComponent(text)}`),
  uploadChunk: (streamId, blob) => {
    const formData = new FormData();
    formData.append('chunk', blob);
    return api.post(`/live/${streamId}/upload-chunk`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// ---- Wallet ----
export const walletAPI = {
  getBalance: () => api.get('/wallet'),
  getTransactions: (page = 1) => api.get(`/wallet/transactions?page=${page}`),
  initiateTopup: (amountEur) => api.post(`/wallet/topup/initiate?amount_eur=${amountEur}`),
  withdraw: (amount) => api.post(`/wallet/withdraw?amount=${amount}`),
};

// ---- Gifts ----
export const giftsAPI = {
  getAll: () => api.get('/gifts'),
  send: (recipientId, giftId, streamId = null) => {
    const url = streamId 
      ? `/gifts/send?recipient_id=${recipientId}&gift_id=${giftId}&stream_id=${streamId}`
      : `/gifts/send?recipient_id=${recipientId}&gift_id=${giftId}`;
    return api.post(url);
  },
  seedGifts: () => api.post('/gifts/seed'),
};


export default api;
