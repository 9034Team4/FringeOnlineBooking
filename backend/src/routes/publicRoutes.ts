import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { PublicEventController } from '../controllers/public/PublicEventController';

const router = Router();

// Helper function to wrap controller handlers
const wrapHandler = (handler: any): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res))
      .catch(next);
  };
};

// Public event routes - NOTE: Order matters! More specific routes should come first
router.get('/events', wrapHandler(PublicEventController.listEvents));
router.get('/events/search', wrapHandler(PublicEventController.searchEvents));
router.get('/events/:id', wrapHandler(PublicEventController.getEventDetails));
// 座位信息路由
router.get('/events/:eventId/seats', wrapHandler(PublicEventController.getEventSeats));

export default router; 