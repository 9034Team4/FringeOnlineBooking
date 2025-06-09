import axiosInstance from './axiosInstance';

// --- Auth ---
export const auth = {
  register: (data) =>
    axiosInstance.post('/public/auth/register', data),
  login: (data) =>
    axiosInstance.post('/public/auth/login', data),
  getProfile: () =>
    axiosInstance.get('/public/auth/profile'),
  updateProfile: (data) =>
    axiosInstance.put('/public/auth/profile', data),
  changePassword: (data) =>
    axiosInstance.put('/public/auth/change-password', data),
};

// --- Events ------
export const events = {
  list: (params) =>
    axiosInstance.get('/public/events', { params }),
  details: (id) =>
    axiosInstance.get(`/public/events/${id}`),
  search: (params) =>
    axiosInstance.get('/public/events/search', { params }),
};

// --- Tickets ---
export const tickets = {
  book: (data) =>
    axiosInstance.post('/tickets/book', data),
  get: (id) =>
    axiosInstance.get(`/tickets/${id}`),
  getMy: () =>
    axiosInstance.get('/tickets/my'),
  cancel: (id, data) =>
    axiosInstance.post(`/tickets/${id}/cancel`, data),
  validate: (ticketId) =>
    axiosInstance.get(`/tickets/validate/${ticketId}`),
};

// --- Bookings ---
export const bookings = {
  create: (data) =>
    axiosInstance.post('/bookings', data),
  getMy: () =>
    axiosInstance.get('/bookings/my'),
  get: (id) =>
    axiosInstance.get(`/bookings/${id}`),
  cancel: (id) =>
    axiosInstance.post(`/bookings/${id}/cancel`),
  confirm: (id) =>
    axiosInstance.post(`/bookings/${id}/confirm`),
  export: (id) =>
    axiosInstance.get(`/bookings/${id}/export`),
};

// --- Seats ---
export const seats = {
  getMap: (eventId) =>
    axiosInstance.get(`/seats/${eventId}`),
  select: (data) =>
    axiosInstance.post('/seats/select', data),
  lock: (data) =>
    axiosInstance.post('/seats/lock', data),
  release: (data) =>
    axiosInstance.post('/seats/release', data),
};

// --- Payment ---
export const payment = {
  process: (data) =>
    axiosInstance.post('/payment/process', data),
  refund: (data) =>
    axiosInstance.post('/payment/refund', data),
};

// --- Notifications ---
export const notifications = {
  sendEmail: (data) =>
    axiosInstance.post('/notifications/email', data),
}; 