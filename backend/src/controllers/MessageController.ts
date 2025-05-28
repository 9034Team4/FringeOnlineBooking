/**
 * @swagger
 * tags:
 *   - name: Message
 *     description: Messaging between users and admins
 */
import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Message } from '../entities/Message';
import { User } from '../entities/User';

export const MessageController = {
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
   */
  async sendMessage(req: Request, res: Response) {
    const { receiverId, content } = req.body;
    const senderId = req.user.userId;

    if (!receiverId || !content) {
      return res.status(400).json({ message: 'receiverId and content are required' });
    }

    const userRepo = AppDataSource.getRepository(User);
    const receiver = await userRepo.findOne({ where: { id: receiverId } });
    if (!receiver) return res.status(404).json({ message: 'Receiver not found' });

    const messageRepo = AppDataSource.getRepository(Message);
    const message = messageRepo.create({
      sender: { id: senderId },
      receiver: { id: receiverId },
      content,
    });
    await messageRepo.save(message);
    res.status(201).json({ message });
  },

  /**
   * @swagger
   * /messages:
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
  async getMessages(req: Request, res: Response) {
    const userId = req.user.userId;
    const contactId = req.query.contactId as string;
    const messageRepo = AppDataSource.getRepository(Message);

    if (!contactId) {
      return res.status(400).json({ message: 'contactId is required' });
    }

    const messages = await messageRepo.find({
      where: [
        { sender: { id: userId }, receiver: { id: contactId } },
        { sender: { id: contactId }, receiver: { id: userId } }
      ],
      order: { createdAt: 'ASC' }
    });

    res.json({ messages });
  }
}; 