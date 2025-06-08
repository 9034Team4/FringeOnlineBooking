import { UserAuthController } from '../../controllers/public/UserAuthController';
import { Request, Response } from 'express';

describe('UserAuthController.register', () => {
  it('should return 400 if email or password is missing', async () => {
    const req = { body: { email: '', password: '' } } as Request;
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res = { status } as unknown as Response;

    await UserAuthController.register(req, res);
    expect(status).toBeCalledWith(400);
    expect(json).toBeCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  it('should return 400 for invalid email format', async () => {
    const req = { body: { email: 'invalidemail', password: 'Pass1234' } } as Request;
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res = { status } as unknown as Response;

    await UserAuthController.register(req, res);
    expect(status).toBeCalledWith(400);
  });

  it('should return 201 for valid user registration', async () => {
    const req = { body: { email: 'test@example.com', password: 'Pass1234' } } as Request;
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res = { status } as unknown as Response;

    jest.spyOn(require('../../config/data-source').AppDataSource.getRepository('User'), 'findOne')
      .mockResolvedValue(null);
    jest.spyOn(require('../../config/data-source').AppDataSource.getRepository('User'), 'save')
      .mockResolvedValue({ id: '123', email: 'test@example.com', name: 'test' });

    await UserAuthController.register(req, res);
    expect(status).toBeCalledWith(201);
  });
});
