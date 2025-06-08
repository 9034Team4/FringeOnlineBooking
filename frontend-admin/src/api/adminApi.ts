import axiosInstance from './axiosInstance';

// --- Admin Auth ---
export const adminAuth = {
  login: (data: { email: string; password: string }) =>
    axiosInstance.post('/admin/login', data),
};

// --- Admin Events ---
export const adminEvents = {
  list: () =>
    axiosInstance.get('/admin/events'),
  create: (data: any) =>
    axiosInstance.post('/admin/events', data),
  get: (id: string) =>
    axiosInstance.get(`/admin/events/${id}`),
  update: (id: string, data: any) =>
    axiosInstance.put(`/admin/events/${id}`, data),
  remove: (id: string) =>
    axiosInstance.delete(`/admin/events/${id}`),
};

// --- Admin Dashboard ---
export const adminDashboard = {
  stats: () =>
    axiosInstance.get('/admin/dashboard-stats'),
};

// --- Admin Settings ---
export const adminSettings = {
  getAll: () =>
    axiosInstance.get('/admin/settings'), 
  update: (key: string, data: { value: any }) =>
    axiosInstance.put(`/admin/settings/${key}`, data),
};

// --- Admin Tickets ---
export const adminTickets = {
  getByEvent: (eventId: string, params?: any) =>
    axiosInstance.get(`/admin/tickets/${eventId}`, { params }),
};

// --- Admin Venues ---
export const adminVenues = {
  list: () =>
    axiosInstance.get('/admin/venues'),
  create: (data: any) =>
    axiosInstance.post('/admin/venues', data),
  get: (id: string) =>
    axiosInstance.get(`/admin/venues/${id}`),
  update: (id: string, data: any) =>
    axiosInstance.put(`/admin/venues/${id}`, data),
  remove: (id: string) =>
    axiosInstance.delete(`/admin/venues/${id}`),
};

// --- Admin Seats ---
export const adminSeats = {
  getByVenue: (venueId: string) =>
    axiosInstance.get(`/admin/seats/${venueId}`),
  create: (data: any) =>
    axiosInstance.post('/admin/seats', data),
}; 