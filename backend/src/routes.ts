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
const ticketController = new TicketController();

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
router.post('/auth/register', UserAuthController.register);

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
router.post('/auth/login', UserAuthController.login);

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
router.post('/tickets', authenticateJWT, ticketController.bookTicket.bind(ticketController));

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
router.get('/tickets/:id', authenticateJWT, ticketController.getTicketDetails.bind(ticketController));

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
router.get('/tickets/user', authenticateJWT, ticketController.getUserTickets.bind(ticketController));

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
router.post('/tickets/:id/cancel', authenticateJWT, ticketController.cancelTicket.bind(ticketController));

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
router.post('/tickets/:id/validate', authenticateJWT, authorizeRole('staff'), ticketController.validateTicket.bind(ticketController));

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
router.post('/bookings', authenticateJWT, BookingController.bookTicket);

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
router.get('/bookings/:id', authenticateJWT, BookingController.getBookingDetails);

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
router.post('/payments', authenticateJWT, PaymentController.processPayment);

// 🔒 Admin Portal Routes

/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin Auth]
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/admin/login', AdminAuthController.login);

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
router.get('/admin/events', authenticateJWT, authorizeRole('admin'), EventController.getAll);

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
router.post('/admin/events', authenticateJWT, authorizeRole('admin'), EventController.create);

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
router.get('/admin/events/:id', authenticateJWT, authorizeRole('admin'), EventController.getById);

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
router.put('/admin/events/:id', authenticateJWT, authorizeRole('admin'), EventController.update);

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
router.delete('/admin/events/:id', authenticateJWT, authorizeRole('admin'), EventController.remove);

// (Other admin endpoints can follow the same pattern with security tag)

export default router;
