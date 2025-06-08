import { Router } from 'express';

import { authenticateJWT, authorizeRole } from './middleware/auth';
import { UserRole } from './entities/User';

// Admin controllers
import { EventController } from './controllers/admin/EventController';
import { VenueController } from './controllers/admin/VenueController';
import { SeatController } from './controllers/admin/SeatController';
import { TicketAdminController } from './controllers/admin/TicketAdminController';
import { AdminAuthController } from './controllers/admin/AdminAuthController';
import { AdminSettingsController } from './controllers/admin/AdminSettingsController';
import { AdminStatsController } from './controllers/admin/AdminStatsController';

// Public controllers
import { PublicEventController } from './controllers/public/PublicEventController';
import { BookingController } from './controllers/public/BookingController';
import { UserAuthController } from './controllers/public/UserAuthController';
import { PaymentController } from './controllers/public/PaymentController';
import { TicketController } from './controllers/public/TicketController';

import { HealthController } from './controllers/HealthController';

const router = Router();

// ================= Monitoring & Health =================
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

// ================= User Auth =================
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

// ================= Admin Stats =================
/**
 * @swagger
 * /admin/stats/users:
 *   get:
 *     summary: 获取用户总数
 *     tags: [AdminStats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 用户总数
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 */
router.get('/admin/stats/users', authenticateJWT, authorizeRole(UserRole.ADMIN), (req, res) => {
  AdminStatsController.totalUsers(req, res);
});

/**
 * @swagger
 * /admin/stats/events:
 *   get:
 *     summary: 获取活动总数
 *     tags: [AdminStats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 活动总数
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 */
router.get('/admin/stats/events', authenticateJWT, authorizeRole(UserRole.ADMIN), (req, res) => {
  AdminStatsController.totalEvents(req, res);
});

/**
 * @swagger
 * /admin/stats/bookings:
 *   get:
 *     summary: 获取订单总数
 *     tags: [AdminStats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 订单总数
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 */
router.get('/admin/stats/bookings', authenticateJWT, authorizeRole(UserRole.ADMIN), (req, res) => {
  AdminStatsController.totalBookings(req, res);
});

/**
 * @swagger
 * /admin/stats/revenue:
 *   get:
 *     summary: 获取近7天每周收入
 *     tags: [AdminStats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 每周收入
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 days:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       total:
 *                         type: number
 */
router.get('/admin/stats/revenue', authenticateJWT, authorizeRole(UserRole.ADMIN), (req, res) => {
  AdminStatsController.weeklyRevenue(req, res);
});

/**
 * @swagger
 * /admin/stats/ticket-distribution:
 *   get:
 *     summary: 获取票分布饼图数据
 *     tags: [AdminStats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 票分布数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 distribution:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       label:
 *                         type: string
 *                       value:
 *                         type: integer
 */
router.get('/admin/stats/ticket-distribution', authenticateJWT, authorizeRole(UserRole.ADMIN), (req, res) => {
  AdminStatsController.ticketDistribution(req, res);
});

/**
 * @swagger
 * /admin/stats/traffic:
 *   get:
 *     summary: 获取日流量统计
 *     tags: [AdminStats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 日流量数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hours:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       hour:
 *                         type: string
 *                       count:
 *                         type: integer
 */
router.get('/admin/stats/traffic', authenticateJWT, authorizeRole(UserRole.ADMIN), (req, res) => {
  AdminStatsController.dailyTraffic(req, res);
});

// ================= 其他已有路由（保留原有逻辑） =================
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
 * /seats/select:
 *   post:
 *     summary: (Deprecated) Select a seat for an event
 *     tags: [Seats]
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
 *               seatIds:
 *                 type: array
 *                 items:
 *                   type: number
 *     responses:
 *       200:
 *         description: Seat selected
 */
router.post('/seats/select', authenticateJWT, (req, res) => {
  SeatController.lockSeats(req, res);
});

/**
 * @swagger
 * /seats/lock-seat:
 *   post:
 *     summary: (Deprecated) Lock a seat for a period
 *     tags: [Seats]
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
 *               seatIds:
 *                 type: array
 *                 items:
 *                   type: number
 *     responses:
 *       200:
 *         description: Seat locked successfully
 */
router.post('/seats/lock-seat', authenticateJWT, (req, res) => {
  SeatController.lockSeats(req, res);
});

/**
 * @swagger
 * /seats/release:
 *   post:
 *     summary: (Deprecated) Release a seat manually
 *     tags: [Seats]
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
 *               seatIds:
 *                 type: array
 *                 items:
 *                   type: number
 *     responses:
 *       200:
 *         description: Seat released
 */
router.post('/seats/release', authenticateJWT, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'This endpoint is deprecated. Seats are automatically released after timeout or can be released by admin.',
    data: null
  });
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
router.get('/admin/events', authenticateJWT, authorizeRole(UserRole.ADMIN), (req, res) => {
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
router.post('/admin/events', authenticateJWT, authorizeRole(UserRole.ADMIN), (req, res) => {
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
router.get('/admin/events/:id', authenticateJWT, authorizeRole(UserRole.ADMIN), (req, res) => {
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
router.put('/admin/events/:id', authenticateJWT, authorizeRole(UserRole.ADMIN), (req, res) => {
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
router.delete('/admin/events/:id', authenticateJWT, authorizeRole(UserRole.ADMIN), (req, res) => {
  EventController.remove(req, res);
});

// ================= Admin Seat Management =================
/**
 * @swagger
 * /admin/venues/{venueId}/seats:
 *   get:
 *     summary: Get all seats for a venue
 *     tags: [Seats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *         description: Venue ID
 *     responses:
 *       200:
 *         description: List of venue seats
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                       seatNumber:
 *                         type: string
 *                       row:
 *                         type: string
 *                       section:
 *                         type: string
 *                       price:
 *                         type: number
 *                       type:
 *                         type: string
 *                       status:
 *                         type: string
 */
router.get('/admin/venues/:venueId/seats', authenticateJWT, authorizeRole(UserRole.ADMIN), (req, res) => {
  SeatController.getByVenue(req, res);
});

/**
 * @swagger
 * /admin/seats:
 *   post:
 *     summary: Create a new seat
 *     tags: [Seats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               venueId:
 *                 type: string
 *               section:
 *                 type: string
 *               row:
 *                 type: string
 *               number:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [standard, vip, wheelchair]
 *               price:
 *                 type: number
 *               eventId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Seat created successfully
 */
router.post('/admin/seats', authenticateJWT, authorizeRole(UserRole.ADMIN), (req, res) => {
  SeatController.create(req, res);
});

// ================= Event Seat Booking =================
/**
 * @swagger
 * /events/{eventId}/seats:
 *   get:
 *     summary: Get all available seats for an event
 *     tags: [Seats]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: List of available seats
 */
router.get('/events/:eventId/seats', (req, res) => {
  SeatController.getAvailableSeats(req, res);
});

/**
 * @swagger
 * /seats/lock:
 *   post:
 *     summary: Lock seats for booking
 *     tags: [Seats]
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
 *               seatIds:
 *                 type: array
 *                 items:
 *                   type: number
 *     responses:
 *       200:
 *         description: Seats locked successfully
 */
router.post('/seats/lock', authenticateJWT, (req, res) => {
  SeatController.lockSeats(req, res);
});

/**
 * @swagger
 * /seats/confirm:
 *   post:
 *     summary: Confirm seat booking after payment
 *     tags: [Seats]
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
 *               seatIds:
 *                 type: array
 *                 items:
 *                   type: number
 *     responses:
 *       200:
 *         description: Seats confirmed successfully
 */
router.post('/seats/confirm', authenticateJWT, (req, res) => {
  SeatController.confirmBooking(req, res);
});

/**
 * @swagger
 * /admin/seats/release-expired:
 *   post:
 *     summary: Release expired seat locks
 *     tags: [Seats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expired seats released successfully
 */
router.post('/admin/seats/release-expired', authenticateJWT, authorizeRole(UserRole.ADMIN), (req, res) => {
  SeatController.releaseExpiredLocks(req, res);
});

/**
 * @swagger
 * /seats/release-user-locks:
 *   post:
 *     summary: User releases their own locked seats
 *     tags: [Seats]
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
 *               seatIds:
 *                 type: array
 *                 items:
 *                   type: number
 *     responses:
 *       200:
 *         description: User's locked seats released successfully
 */
router.post('/seats/release-user-locks', authenticateJWT, (req, res) => {
  SeatController.releaseUserLocks(req, res);
});

/**
 * @swagger
 * /seats/lock-status:
 *   get:
 *     summary: Get seat lock status
 *     tags: [Seats]
 *     parameters:
 *       - in: query
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *       - in: query
 *         name: seatIds
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated seat IDs
 *     responses:
 *       200:
 *         description: Seat lock status retrieved successfully
 */
router.get('/seats/lock-status', authenticateJWT, (req, res) => {
  SeatController.getLockStatus(req, res);
});

export default router;
