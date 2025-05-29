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
    const messageRepo = AppDataSource.getRepository(Message);

    const messages = await messageRepo.find({
      where: [
        { sender: { id: userId } },
        { receiver: { id: userId } }
      ],
      relations: ['sender', 'receiver'],
      order: { createdAt: 'DESC' }
    });

    res.json({ messages });
  },

  async getConversation(req: Request, res: Response) {
    const userId = req.user.userId;
    const { userId: otherUserId } = req.params;
    const messageRepo = AppDataSource.getRepository(Message);

    const userRepo = AppDataSource.getRepository(User);
    const otherUser = await userRepo.findOne({ where: { id: otherUserId } });
    if (!otherUser) return res.status(404).json({ message: 'User not found' });

    const messages = await messageRepo.find({
      where: [
        { sender: { id: userId }, receiver: { id: otherUserId } },
        { sender: { id: otherUserId }, receiver: { id: userId } }
      ],
      relations: ['sender', 'receiver'],
      order: { createdAt: 'ASC' }
    });

    res.json({ messages });
  },

  async deleteMessage(req: Request, res: Response) {
    const userId = req.user.userId;
    const { id } = req.params;
    const messageRepo = AppDataSource.getRepository(Message);

    const message = await messageRepo.findOne({
      where: { id },
      relations: ['sender']
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.id !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await messageRepo.remove(message);
    res.json({ message: 'Message deleted' });
  }
}; 