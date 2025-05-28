import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { MessageController } from '../controllers/MessageController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Helper to wrap async handlers
const wrapHandler = (handler: any): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res)).catch(next);
  };
};

/**
 * @swagger
 * /messages:
 *   post:
 *     summary: Send a message to another user
 *     tags: [Message]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receiverId:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent
 *   get:
 *     summary: Get messages between current user and a contact
 *     tags: [Message]
 *     parameters:
 *       - in: query
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of messages
 */
router.post('/', requireAuth, wrapHandler(MessageController.sendMessage));
router.get('/', requireAuth, wrapHandler(MessageController.getMessages));

export default router; 