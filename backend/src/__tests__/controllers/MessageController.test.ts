import { MessageController } from '../../controllers/MessageController';
import { Request, Response } from 'express';
import { AppDataSource } from '../../config/data-source';
import { Message } from '../../entities/Message';
import { User } from '../../entities/User';

jest.mock('../../config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn()
  }
}));

describe('MessageController', () => {
  const mockMessageRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn()
  };

  const mockUserRepo = {
    findOne: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === Message) return mockMessageRepo;
      if (entity === User) return mockUserRepo;
    });
  });

  const mockRes = () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    return { json, status };
  };

  it('sendMessage should return 400 if missing fields', async () => {
    const req = { body: {}, user: { userId: 'u1' } } as unknown as Request;
    const res = mockRes();
    await MessageController.sendMessage(req, res as unknown as Response);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('sendMessage should return 404 if receiver not found', async () => {
    mockUserRepo.findOne.mockResolvedValue(null);
    const req = { body: { receiverId: 'u2', content: 'Hello' }, user: { userId: 'u1' } } as unknown as Request;
    const res = mockRes();
    await MessageController.sendMessage(req, res as unknown as Response);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('sendMessage should create and return message', async () => {
    mockUserRepo.findOne.mockResolvedValue({ id: 'u2' });
    mockMessageRepo.create.mockReturnValue({ id: 'm1', content: 'Hello' });
    mockMessageRepo.save.mockResolvedValue({ id: 'm1', content: 'Hello' });
    const req = { body: { receiverId: 'u2', content: 'Hello' }, user: { userId: 'u1' } } as unknown as Request;
    const res = mockRes();
    await MessageController.sendMessage(req, res as unknown as Response);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.status().json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(Object) }));
  });

  it('getMessages should return messages for user', async () => {
    mockMessageRepo.find.mockResolvedValue([{ id: 'm1' }, { id: 'm2' }]);
    const req = { user: { userId: 'u1' } } as unknown as Request;
    const res = mockRes();
    await MessageController.getMessages(req, res as unknown as Response);
    expect(res.json).toHaveBeenCalledWith({ messages: expect.any(Array) });
  });

  it('getConversation should return 404 if other user not found', async () => {
    mockUserRepo.findOne.mockResolvedValue(null);
    const req = { user: { userId: 'u1' }, params: { userId: 'u2' } } as unknown as Request;
    const res = mockRes();
    await MessageController.getConversation(req, res as unknown as Response);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('getConversation should return conversation between users', async () => {
    mockUserRepo.findOne.mockResolvedValue({ id: 'u2' });
    mockMessageRepo.find.mockResolvedValue([{ id: 'm1' }, { id: 'm2' }]);
    const req = { user: { userId: 'u1' }, params: { userId: 'u2' } } as unknown as Request;
    const res = mockRes();
    await MessageController.getConversation(req, res as unknown as Response);
    expect(res.json).toHaveBeenCalledWith({ messages: expect.any(Array) });
  });

  it('deleteMessage should return 404 if message not found', async () => {
    mockMessageRepo.findOne.mockResolvedValue(null);
    const req = { user: { userId: 'u1' }, params: { id: 'm1' } } as unknown as Request;
    const res = mockRes();
    await MessageController.deleteMessage(req, res as unknown as Response);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('deleteMessage should return 403 if not sender', async () => {
    mockMessageRepo.findOne.mockResolvedValue({ sender: { id: 'u2' } });
    const req = { user: { userId: 'u1' }, params: { id: 'm1' } } as unknown as Request;
    const res = mockRes();
    await MessageController.deleteMessage(req, res as unknown as Response);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('deleteMessage should remove message if sender matches', async () => {
    mockMessageRepo.findOne.mockResolvedValue({ sender: { id: 'u1' }, id: 'm1' });
    mockMessageRepo.remove.mockResolvedValue(undefined);
    const req = { user: { userId: 'u1' }, params: { id: 'm1' } } as unknown as Request;
    const res = mockRes();
    await MessageController.deleteMessage(req, res as unknown as Response);
    expect(res.json).toHaveBeenCalledWith({ message: 'Message deleted' });
  });
});
