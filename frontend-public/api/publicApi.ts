import axiosInstance from './axiosInstance';
import { AxiosResponse } from 'axios';

// --- Auth ---
export const auth = {
  register: (data: { email: string; password: string; firstName: string; lastName: string; name?: string }) =>
    axiosInstance.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    axiosInstance.post('/auth/login', data),
  getProfile: (): Promise<AxiosResponse<any>> =>
    axiosInstance.get('/auth/profile'),
  updateProfile: (data: { name?: string; firstName?: string; lastName?: string; avatar?: string }) =>
    axiosInstance.put('/auth/profile', data),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    axiosInstance.put('/auth/change-password', data),
};

// --- Events ---
export const events = {
  list: (params?: { page?: number; limit?: number; category?: string; status?: string; organizer?: string }) =>
    axiosInstance.get('/public/events', { params }),
  details: (id: string) =>
    axiosInstance.get(`/public/events/${id}`),
  search: (params: any) =>
    axiosInstance.get('/events/search', { params }),
};

// --- Tickets ---
export const tickets = {
  book: (data: { eventId: string; ticketType: string; seatNumber?: string; section?: string }) =>
    axiosInstance.post('/tickets/book', data),
  get: (id: string) =>
    axiosInstance.get(`/tickets/${id}`),
  getMy: () =>
    axiosInstance.get('/tickets/my'),
  cancel: (id: string, data: { reason: string }) =>
    axiosInstance.post(`/tickets/${id}/cancel`, data),
  validate: (ticketId: string) =>
    axiosInstance.get(`/tickets/validate/${ticketId}`),
};

// --- Bookings ---
export const bookings = {
  create: (data: any) =>
    axiosInstance.post('/bookings', data),
  getMy: () =>
    axiosInstance.get('/bookings/my'),
  get: (id: string) =>
    axiosInstance.get(`/bookings/${id}`),
  cancel: (id: string) =>
    axiosInstance.post(`/bookings/${id}/cancel`),
  confirm: (id: string) =>
    axiosInstance.post(`/bookings/${id}/confirm`),
  export: (id: string) =>
    axiosInstance.get(`/bookings/${id}/export`),
};

// --- Seats ---
export const seats = {
  getMap: (eventId: string) =>
    axiosInstance.get(`/seats/${eventId}`), // TODO: Implement on backend if not present
  select: (data: { eventId: string; seatNumber: string }) =>
    axiosInstance.post('/seats/select', data),
  lock: (data: { eventId: string; seatNumber: string }) =>
    axiosInstance.post('/seats/lock', data),
  release: (data: { eventId: string; seatNumber: string }) =>
    axiosInstance.post('/seats/release', data),
};

// --- Payment ---
export const payment = {
  process: (data: { bookingId: string; paymentMethod: string; amount: number }) =>
    axiosInstance.post('/payment/process', data),
  refund: (data: { paymentId: string; amount: number; reason: string }) =>
    axiosInstance.post('/payment/refund', data),
};

// --- Notifications ---
export const notifications = {
  sendEmail: (data: { to: string; subject: string; content: string }) =>
    axiosInstance.post('/notifications/email', data),
}; 