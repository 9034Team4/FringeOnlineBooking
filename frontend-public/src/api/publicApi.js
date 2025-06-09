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
    axiosInstance.post('/public/tickets/book', data),
  get: (id) =>
    axiosInstance.get(`/public/tickets/${id}`),
  getMy: () =>
    axiosInstance.get('/public/tickets/my'),
  cancel: (id, data) =>
    axiosInstance.post(`/public/tickets/${id}/cancel`, data),
  validate: (ticketId) =>
    axiosInstance.get(`/public/tickets/validate/${ticketId}`),
};

// --- Bookings ---
export const bookings = {
  create: (data) =>
    axiosInstance.post('/public/bookings', data),
  getMy: () =>
    axiosInstance.get('/public/bookings/my'),
  get: (id) =>
    axiosInstance.get(`/public/bookings/${id}`),
  cancel: (id) =>
    axiosInstance.post(`/public/bookings/${id}/cancel`),
  confirm: (id) =>
    axiosInstance.post(`/public/bookings/${id}/confirm`),
  export: (id) =>
    axiosInstance.get(`/public/bookings/${id}/export`),
};

// --- Seats ---
export const seats = {
  getMap: (eventId) =>
    axiosInstance.get(`/public/seats/${eventId}`),
  select: (data) =>
    axiosInstance.post('/public/seats/select', data),
  lock: (data) =>
    axiosInstance.post('/public/seats/lock', data),
  release: (data) =>
    axiosInstance.post('/public/seats/release', data),
};

// --- Payment ---
export const payment = {
  process: (data) =>
    axiosInstance.post('/public/payment/process', data),
  refund: (data) =>
    axiosInstance.post('/public/payment/refund', data),
};

// --- Notifications ---
export const notifications = {
  sendEmail: (data) =>
    axiosInstance.post('/public/notifications/email', data),
}; 