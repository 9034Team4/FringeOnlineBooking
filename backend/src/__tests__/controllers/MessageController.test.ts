import { Request, Response } from 'express';
import { MessageController } from '../../controllers/MessageController';
import { setupTestDatabase, createTestUser, createTestMessage, cleanupTestDatabase } from '../utils/testUtils';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../../entities/User';
import { Message } from '../../entities/Message';

describe('MessageController', () => {
  let dataSource: DataSource;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any;
  let sender: User;
  let receiver: User;

  beforeAll(async () => {
    dataSource = await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase(dataSource);
  });

  beforeEach(async () => {
    responseObject = {};
    mockRequest = {};
    mockResponse = {
      json: jest.fn().mockImplementation((result) => {
        responseObject = result;
        return mockResponse;
      }),
      status: jest.fn().mockImplementation((code) => {
        responseObject.status = code;
        return mockResponse;
      }),
    };

    // Create test users for each test
    sender = await createTestUser(dataSource);
    receiver = await createTestUser(dataSource);
  });

  describe('sendMessage', () => {
    it('should create a new message', async () => {
      const messageData = {
        receiverId: receiver.id,
        content: 'Test message content',
      };
      mockRequest.body = messageData;
      mockRequest.user = { id: sender.id };

      await MessageController.sendMessage(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.message.content).toBe(messageData.content);
      expect(responseObject.message.sender.id).toBe(sender.id);
      expect(responseObject.message.receiver.id).toBe(receiver.id);
    });

    it('should return 404 if receiver not found', async () => {
      const messageData = {
        receiverId: 'non-existent-id',
        content: 'Test message content',
      };
      mockRequest.body = messageData;
      mockRequest.user = { id: sender.id };

      await MessageController.sendMessage(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Receiver not found',
      });
    });
  });

  describe('getMessages', () => {
    it('should return all messages for a user', async () => {
      // Create some test messages
      await createTestMessage(dataSource, sender, receiver);
      await createTestMessage(dataSource, receiver, sender);

      mockRequest.user = { id: sender.id };

      await MessageController.getMessages(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.messages).toHaveLength(2);
    });
  });

  describe('getConversation', () => {
    it('should return messages between two users', async () => {
      // Create some test messages
      await createTestMessage(dataSource, sender, receiver);
      await createTestMessage(dataSource, receiver, sender);

      mockRequest.params = { userId: receiver.id };
      mockRequest.user = { id: sender.id };

      await MessageController.getConversation(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.messages).toHaveLength(2);
    });

    it('should return 404 if other user not found', async () => {
      mockRequest.params = { userId: 'non-existent-id' };
      mockRequest.user = { id: sender.id };

      await MessageController.getConversation(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User not found',
      });
    });
  });

  describe('deleteMessage', () => {
    it('should delete a message', async () => {
      const message = await createTestMessage(dataSource, sender, receiver);
      mockRequest.params = { id: message.id };
      mockRequest.user = { id: sender.id };

      await MessageController.deleteMessage(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Message deleted',
      });

      // Verify message is actually deleted
      const deletedMessage = await dataSource
        .getRepository(Message)
        .findOne({ where: { id: message.id } });
      expect(deletedMessage).toBeNull();
    });

    it('should return 404 if message not found', async () => {
      mockRequest.params = { id: 'non-existent-id' };
      mockRequest.user = { id: sender.id };

      await MessageController.deleteMessage(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Message not found',
      });
    });

    it('should return 403 if user is not the sender', async () => {
      const message = await createTestMessage(dataSource, sender, receiver);
      mockRequest.params = { id: message.id };
      mockRequest.user = { id: 'different-user-id' };

      await MessageController.deleteMessage(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Not authorized to delete this message',
      });
    });
  });
}); 