import { Router } from 'express';

import { authenticateJWT, authorizeRole } from './middleware/auth';

// Admin controllers
import { EventController } from './controllers/admin/EventController';
import { VenueController } from './controllers/admin/VenueController';
import { SeatController } from './controllers/admin/SeatController';
import { TicketAdminController } from './controllers/admin/TicketAdminController';
import { AdminAuthController } from './controllers/admin/AdminAuthController';
import { AdminSettingsController } from './controllers/admin/AdminSettingsController';

// Public controllers
import { PublicEventController } from './controllers/public/PublicEventController';
import { BookingController } from './controllers/public/BookingController';
import { UserAuthController } from './controllers/public/UserAuthController';
import { PaymentController } from './controllers/public/PaymentController';
import { TicketController } from './controllers/public/TicketController';

import { HealthController } from './controllers/HealthController';

const router = Router();

// 🌐 Public Booking Portal Routes

/**
 * @swagger
 * /:
 *   get:
 *     summary: API homepage health status (HTML UI)
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Health HTML page loaded
 */
router.get('/', HealthController.status);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: API service health check (JSON)
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Health OK
 *       503:
 *         description: Service unavailable
 */
router.get('/health', HealthController.checkStatus);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post('/auth/register', async (req, res) => {
  await UserAuthController.register(req, res);
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login for public users
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/auth/login', async (req, res) => {
  await UserAuthController.login(req, res);
});

/**
 * @swagger
 * /tickets:
 *   post:
 *     summary: Book a new ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventId:
 *                 type: string
 *               ticketType:
 *                 type: string
 *               seatNumber:
 *                 type: string
 *               section:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ticket booked successfully
 */
router.post('/tickets', authenticateJWT, async (req, res) => {
  await TicketController.bookTicket(req, res);
});

/**
 * @swagger
 * /tickets/{id}:
 *   get:
 *     summary: Get ticket details
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket details returned
 */
router.get('/tickets/:id', authenticateJWT, async (req, res) => {
  await TicketController.getTicketDetails(req, res);
});

/**
 * @swagger
 * /tickets/user:
 *   get:
 *     summary: Get all tickets for the current user
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's tickets returned
 */
router.get('/tickets/user', authenticateJWT, async (req, res) => {
  await TicketController.getUserTickets(req, res);
});

/**
 * @swagger
 * /tickets/{id}/cancel:
 *   post:
 *     summary: Cancel a ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ticket cancelled successfully
 */
router.post('/tickets/:id/cancel', authenticateJWT, async (req, res) => {
  await TicketController.requestRefund(req, res);
});

/**
 * @swagger
 * /tickets/{id}/validate:
 *   post:
 *     summary: Validate a ticket (for event staff)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket validated successfully
 */
// router.post('/tickets/:id/validate', authenticateJWT, authorizeRole('staff'), async (req, res) => {
//   await TicketController.validateTicket(req, res);
// }); // Uncomment and implement if needed

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Book tickets for an event
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Booking created
 */
router.post('/bookings', authenticateJWT, async (req, res) => {
  await BookingController.bookTicket(req, res);
});

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get booking details by ID
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking details returned
 */
router.get('/bookings/:id', authenticateJWT, async (req, res) => {
  await BookingController.getBookingDetails(req, res);
});

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Process payment for a booking
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment successful
 */
router.post('/payments', authenticateJWT, async (req, res) => {
  await PaymentController.processPayment(req, res);
});

/**
 * @swagger
 * /api/payment/process:
 *   post:
 *     summary: Process payment for a booking
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - paymentMethod
 *               - amount
 *             properties:
 *               bookingId:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Payment processed and booking confirmed
 */
router.post('/api/payment/process', authenticateJWT, async (req, res) => {
  await PaymentController.processPaymentApi(req, res);
});

/**
 * @swagger
 * /api/bookings/my:
 *   get:
 *     summary: Get all bookings for the current user
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User bookings retrieved successfully
 */
router.get('/api/bookings/my', authenticateJWT, async (req, res) => {
  await BookingController.getMyBookings(req, res);
});

/**
 * @swagger
 * /api/bookings/{id}/export:
 *   get:
 *     summary: Export booking details and tickets as PDF/CSV
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking export generated
 */
router.get('/api/bookings/:id/export', authenticateJWT, async (req, res) => {
  await BookingController.exportBooking(req, res);
});

/**
 * @swagger
 * /api/tickets/validate/{ticketId}:
 *   get:
 *     summary: Validate (scan) a ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket validated and marked as USED
 */
router.get('/api/tickets/validate/:ticketId', authenticateJWT, async (req, res) => {
  await TicketController.validateTicket(req, res);
});

/**
 * @swagger
 * /api/seats/select:
 *   post:
 *     summary: Select a seat for an event
 *     tags: [Seats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - seatNumber
 *             properties:
 *               eventId:
 *                 type: string
 *               seatNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Seat selected and reserved temporarily
 */
router.post('/api/seats/select', authenticateJWT, async (req, res) => {
  await SeatController.selectSeat(req, res);
});

/**
 * @swagger
 * /api/seats/lock:
 *   post:
 *     summary: Lock a seat for a period
 *     tags: [Seats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - seatNumber
 *             properties:
 *               eventId:
 *                 type: string
 *               seatNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Seat locked for a period
 */
router.post('/api/seats/lock', authenticateJWT, async (req, res) => {
  await SeatController.lockSeat(req, res);
});

/**
 * @swagger
 * /api/seats/release:
 *   post:
 *     summary: Release a seat if not paid/confirmed
 *     tags: [Seats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - seatNumber
 *             properties:
 *               eventId:
 *                 type: string
 *               seatNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Seat released
 */
router.post('/api/seats/release', authenticateJWT, async (req, res) => {
  await SeatController.releaseSeat(req, res);
});

/**
 * @swagger
 * /api/events/search:
 *   get:
 *     summary: Search and filter events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: priceRange
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Events search results
 */
router.get('/api/events/search', async (req, res) => {
  await PublicEventController.searchEvents(req, res);
});

/**
 * @swagger
 * /api/admin/dashboard-stats:
 *   get:
 *     summary: Get admin dashboard stats
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved
 */
router.get('/api/admin/dashboard-stats', authenticateJWT, async (req, res) => {
  await AdminSettingsController.getDashboardStats(req, res);
});

/**
 * @swagger
 * /api/notifications/email:
 *   post:
 *     summary: Send an email notification (simulated)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - subject
 *               - content
 *             properties:
 *               to:
 *                 type: string
 *               subject:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email notification sent (simulated)
 */
router.post('/api/notifications/email', authenticateJWT, async (req, res) => {
  await UserAuthController.sendEmailNotification(req, res);
});

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 */
router.get('/api/auth/profile', authenticateJWT, async (req, res) => {
  await UserAuthController.getProfile(req, res);
});

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/api/auth/profile', authenticateJWT, async (req, res) => {
  await UserAuthController.updateProfile(req, res);
});

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.put('/api/auth/change-password', authenticateJWT, async (req, res) => {
  await UserAuthController.changePassword(req, res);
});

/**
 * @swagger
 * /api/tickets/book:
 *   post:
 *     summary: Book a ticket manually
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - ticketType
 *             properties:
 *               eventId:
 *                 type: string
 *               ticketType:
 *                 type: string
 *               seatNumber:
 *                 type: string
 *               section:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ticket booked manually
 */
router.post('/api/tickets/book', authenticateJWT, async (req, res) => {
  await TicketController.bookTicketManual(req, res);
});

/**
 * @swagger
 * /api/tickets/my:
 *   get:
 *     summary: Get all tickets for the current user (alias)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's tickets returned
 */
router.get('/api/tickets/my', authenticateJWT, async (req, res) => {
  await TicketController.getMyTickets(req, res);
});

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   post:
 *     summary: Cancel a booking by ID
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 */
router.post('/api/bookings/:id/cancel', authenticateJWT, async (req, res) => {
  await BookingController.cancelBookingById(req, res);
});

/**
 * @swagger
 * /api/bookings/{id}/confirm:
 *   post:
 *     summary: Confirm a booking by ID (after payment)
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking confirmed successfully
 */
router.post('/api/bookings/:id/confirm', authenticateJWT, async (req, res) => {
  await BookingController.confirmBookingById(req, res);
});

/**
 * @swagger
 * /api/payment/refund:
 *   post:
 *     summary: Refund a payment
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *               - amount
 *               - reason
 *             properties:
 *               paymentId:
 *                 type: string
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment refunded successfully
 */
router.post('/api/payment/refund', authenticateJWT, async (req, res) => {
  await PaymentController.refundPaymentApi(req, res);
});

/**
 * @swagger
 * /api/public/events:
 *   get:
 *     summary: List all public events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of public events
 */
router.get('/api/public/events', async (req, res) => {
  await PublicEventController.listEvents(req, res);
});

/**
 * @swagger
 * /api/public/events/{id}:
 *   get:
 *     summary: Get public event details
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Public event details returned
 */
router.get('/api/public/events/:id', async (req, res) => {
  await PublicEventController.getEventDetails(req, res);
});

// 🔒 Admin Portal Routes

/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Admin password (min 8 characters)
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     admin:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post('/admin/login', (req, res) => {
  AdminAuthController.login(req, res);
});

/**
 * @swagger
 * /admin/events:
 *   get:
 *     summary: Get all events (admin)
 *     tags: [Admin - Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all events
 */
router.get('/admin/events', authenticateJWT, authorizeRole('admin'), (req, res) => {
  EventController.getAll(req, res);
});

/**
 * @swagger
 * /admin/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Admin - Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Event created
 */
router.post('/admin/events', authenticateJWT, authorizeRole('admin'), (req, res) => {
  EventController.create(req, res);
});

/**
 * @swagger
 * /admin/events/{id}:
 *   get:
 *     summary: Get an event by ID
 *     tags: [Admin - Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event detail
 */
router.get('/admin/events/:id', authenticateJWT, authorizeRole('admin'), (req, res) => {
  EventController.getById(req, res);
});

/**
 * @swagger
 * /admin/events/{id}:
 *   put:
 *     summary: Update an event
 *     tags: [Admin - Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event updated
 */
router.put('/admin/events/:id', authenticateJWT, authorizeRole('admin'), (req, res) => {
  EventController.update(req, res);
});

/**
 * @swagger
 * /admin/events/{id}:
 *   delete:
 *     summary: Delete an event
 *     tags: [Admin - Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Event deleted
 */
router.delete('/admin/events/:id', authenticateJWT, authorizeRole('admin'), (req, res) => {
  EventController.remove(req, res);
});

// (Other admin endpoints can follow the same pattern with security tag)

export default router;
