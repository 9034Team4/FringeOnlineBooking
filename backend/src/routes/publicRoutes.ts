import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { PublicEventController } from '../controllers/public/PublicEventController';
import { requireAuth } from '../middlewares/auth';
import { BookingController } from '../controllers/public/BookingController';
import { TicketController } from '../controllers/public/TicketController';
import { UserAuthController } from '../controllers/public/UserAuthController';
import { DatabaseController } from '../controllers/DatabaseController';

const router = Router();

// Helper function to wrap controller handlers
const wrapHandler = (handler: any): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res))
      .catch(next);
  };
};

// 系统状态检查
router.get('/system/status', wrapHandler(DatabaseController.checkDatabaseStatus));

// Public event routes - NOTE: Order matters! More specific routes should come first
router.get('/events', wrapHandler(PublicEventController.listEvents));
router.get('/events/search', wrapHandler(PublicEventController.searchEvents));
router.get('/events/:id', wrapHandler(PublicEventController.getEventDetails));
// 座位信息路由
router.get('/events/:eventId/seats', wrapHandler(PublicEventController.getEventSeats));
// 座位临时锁定和解锁路由
router.post('/events/:eventId/seats/lock', requireAuth, wrapHandler(PublicEventController.lockSeats));
router.post('/events/:eventId/seats/unlock', requireAuth, wrapHandler(PublicEventController.unlockSeats));
// 获取座位锁定剩余时间
router.get('/events/:eventId/seats/lock-time', wrapHandler(PublicEventController.getLockRemainingTime));

// 预订和支付相关路由
router.get('/bookings', requireAuth, wrapHandler(BookingController.getUserBookings));
router.get('/bookings/:id', requireAuth, wrapHandler(BookingController.getBookingDetails));
router.post('/bookings/confirm', requireAuth, wrapHandler(BookingController.confirmBooking));

// 票据相关路由
router.get('/tickets', requireAuth, wrapHandler(TicketController.getUserTickets));
router.get('/tickets/:id', requireAuth, wrapHandler(TicketController.getTicketDetails));
router.get('/user/tickets', requireAuth, wrapHandler(TicketController.getUserTickets));
router.post('/tickets/send-email', requireAuth, wrapHandler(TicketController.sendTicketByEmail));

// 用户认证相关路由
router.get('/auth/profile', requireAuth, wrapHandler(UserAuthController.getProfile));
router.put('/auth/profile', requireAuth, wrapHandler(UserAuthController.updateProfile));
router.post('/auth/register', wrapHandler(UserAuthController.register));
router.post('/auth/login', wrapHandler(UserAuthController.login));
router.post('/auth/change-password', requireAuth, wrapHandler(UserAuthController.changePassword));

export default router; 