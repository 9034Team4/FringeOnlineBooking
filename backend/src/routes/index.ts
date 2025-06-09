import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { UserAuthController } from '../controllers/public/UserAuthController';
import { AdminAuthController } from '../controllers/admin/AdminAuthController';
import { TicketController } from '../controllers/public/TicketController';
import { PaymentController } from '../controllers/public/PaymentController';
import { BookingController } from '../controllers/public/BookingController';
import { requireAuth, requireRole, requireOwnership } from '../middleware/auth';
import { UserRole } from '../entities/User';
import adminStatsRouter from './adminStats';
import staffRouter from './staff';
import messageRouter from './message';
import publicRoutes from './publicRoutes';
import { seed } from '../seeder';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: User authentication and profile
 *   - name: Admin
 *     description: Admin authentication
 *   - name: Ticket
 *     description: Ticket booking and management
 *   - name: Event
 *     description: Public event listing and details
 *   - name: Payment
 *     description: Payment and refund
 *   - name: Booking
 *     description: Booking management
 */

// 类型转换辅助函数
const wrapHandler = (handler: any): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res))
      .catch(next);
  };
};

// Public routes (no auth required)
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
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
 *         description: Registration successful
 */
router.post('/auth/register', wrapHandler(UserAuthController.register));

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
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
router.post('/auth/login', wrapHandler(UserAuthController.login));

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify user email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified
 */
router.post('/auth/verify-email', wrapHandler(UserAuthController.verifyEmail));

/**
 * @swagger
 * /auth/reset-password-request:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset requested
 */
router.post('/auth/reset-password-request', wrapHandler(UserAuthController.requestPasswordReset));

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset user password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post('/auth/reset-password', wrapHandler(UserAuthController.resetPassword));

// Admin routes
/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
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
 *         description: Admin login successful
 */
router.post('/admin/login', wrapHandler(AdminAuthController.login));

// Protected user routes
/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User profile
 *   put:
 *     summary: Update user profile
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
// 注意：这些路由也可以通过/api/public访问
router.get('/auth/profile', requireAuth, wrapHandler(UserAuthController.getProfile));
router.put('/auth/profile', requireAuth, wrapHandler(UserAuthController.updateProfile));

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 */
router.post('/auth/change-password', requireAuth, wrapHandler(UserAuthController.changePassword));

// Protected ticket routes
/**
 * @swagger
 * /tickets:
 *   post:
 *     summary: Book a ticket
 *     tags: [Ticket]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventId:
 *                 type: string
 *               seat:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ticket booked
 *   get:
 *     summary: Get user's tickets
 *     tags: [Ticket]
 *     responses:
 *       200:
 *         description: List of user's tickets
 */
router.post('/tickets', requireAuth, wrapHandler(TicketController.bookTicket));
router.get('/tickets', requireAuth, wrapHandler(TicketController.getUserTickets));

/**
 * @swagger
 * /tickets/{id}:
 *   get:
 *     summary: Get ticket details
 *     tags: [Ticket]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket details
 *   post:
 *     summary: Refund a ticket
 *     tags: [Ticket]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket refunded
 */
router.get('/tickets/:id', requireAuth, requireOwnership('ticket'), wrapHandler(TicketController.getTicketDetails));
router.post('/tickets/:id/refund', requireAuth, requireOwnership('ticket'), wrapHandler(TicketController.requestRefund));

/**
 * @swagger
 * /tickets/{id}/validate:
 *   post:
 *     summary: Validate a ticket (admin/organizer only)
 *     tags: [Ticket]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket validated
 */
router.post('/tickets/:id/validate', requireAuth, requireRole([UserRole.ADMIN, UserRole.ORGANIZER]), wrapHandler(TicketController.validateTicket));

// Protected payment routes
/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Process a payment
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bookingId:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Payment processed
 */
router.post('/payments', requireAuth, wrapHandler(PaymentController.processPayment));

/**
 * @swagger
 * /payments/{id}/refund:
 *   post:
 *     summary: Refund a payment
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment refunded
 */
router.post('/payments/:id/refund', requireAuth, requireOwnership('payment'), wrapHandler(PaymentController.refundPayment));

/**
 * @swagger
 * /payments/process:
 *   post:
 *     summary: Process payment via API
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bookingId:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Payment processed via API
 */
router.post('/payments/process', requireAuth, wrapHandler(PaymentController.processPaymentApi));

/**
 * @swagger
 * /payments/refund:
 *   post:
 *     summary: Refund payment via API
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment refunded via API
 */
router.post('/payments/refund', requireAuth, wrapHandler(PaymentController.refundPaymentApi));

// Protected booking routes
/**
 * @swagger
 * /bookings/seat-map/{eventId}:
 *   get:
 *     summary: Get seat map for an event
 *     tags: [Booking]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Seat map data
 */
router.get('/bookings/seat-map/:eventId', requireAuth, wrapHandler(BookingController.getSeatMap));

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Book a ticket (booking)
 *     tags: [Booking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventId:
 *                 type: string
 *               seat:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created
 *   get:
 *     summary: Get user's bookings
 *     tags: [Booking]
 *     responses:
 *       200:
 *         description: List of user's bookings
 */
router.post('/bookings', requireAuth, wrapHandler(BookingController.bookTicket));
router.get('/bookings', requireAuth, wrapHandler(BookingController.getUserBookings));

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get booking details
 *     tags: [Booking]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking details
 *   post:
 *     summary: Cancel a booking
 *     tags: [Booking]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking cancelled
 */
router.get('/bookings/:id', requireAuth, requireOwnership('booking'), wrapHandler(BookingController.getBookingDetails));
router.post('/bookings/:id/cancel', requireAuth, requireOwnership('booking'), wrapHandler(BookingController.cancelBooking));

/**
 * @swagger
 * /bookings/my:
 *   get:
 *     summary: Get my bookings
 *     tags: [Booking]
 *     responses:
 *       200:
 *         description: List of my bookings
 */
router.get('/bookings/my', requireAuth, wrapHandler(BookingController.getMyBookings));

/**
 * @swagger
 * /bookings/{id}/export:
 *   get:
 *     summary: Export booking details
 *     tags: [Booking]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking exported
 */
router.get('/bookings/:id/export', requireAuth, requireOwnership('booking'), wrapHandler(BookingController.exportBooking));

/**
 * @swagger
 * /bookings/{id}/cancel:
 *   post:
 *     summary: Cancel a booking by ID
 *     tags: [Booking]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking cancelled by ID
 */
router.post('/bookings/:id/cancel', requireAuth, requireOwnership('booking'), wrapHandler(BookingController.cancelBookingById));

/**
 * @swagger
 * /bookings/{id}/confirm:
 *   post:
 *     summary: Confirm a booking by ID (admin/organizer only)
 *     tags: [Booking]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking confirmed by ID
 */
router.post('/bookings/:id/confirm', requireAuth, requireRole([UserRole.ADMIN, UserRole.ORGANIZER]), wrapHandler(BookingController.confirmBookingById));

router.use('/admin/stats', adminStatsRouter);
router.use('/staff', staffRouter);
router.use('/messages', messageRouter);

// Mount public routes
router.use('/public', publicRoutes);

// 添加一个直接执行seed的路由，不需要认证
router.get('/seed-database', async (req: Request, res: Response) => {
  try {
    console.log('开始执行数据库种子填充...');
    await seed();
    console.log('数据库种子填充成功');
    res.json({ success: true, message: '数据库初始化成功' });
  } catch (error) {
    console.error('数据库种子填充失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '数据库初始化失败', 
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router; 