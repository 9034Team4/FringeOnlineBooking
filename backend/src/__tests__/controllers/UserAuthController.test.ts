import { Request, Response } from 'express';
import { UserAuthController } from '../../controllers/public/UserAuthController';
import { setupTestDatabase, createTestUser, cleanupTestDatabase } from '../utils/testUtils';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../../entities/User';
import bcrypt from 'bcryptjs';

describe('UserAuthController', () => {
  let dataSource: DataSource;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any;

  beforeAll(async () => {
    dataSource = await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase(dataSource);
  });

  beforeEach(() => {
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
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };
      mockRequest.body = userData;

      await UserAuthController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(true);
      expect(responseObject.data.user.email).toBe(userData.email);
      expect(responseObject.data.user.name).toBe(userData.name);
      expect(responseObject.data.token).toBeDefined();
    });

    it('should return 400 for invalid input data', async () => {
      const invalidUserData = {
        email: 'invalid-email',
        password: '123', // Too short
      };
      mockRequest.body = invalidUserData;

      await UserAuthController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(false);
    });

    it('should return 400 for duplicate email', async () => {
      // Create a user first
      const existingUser = await createTestUser(dataSource);
      const userData = {
        email: existingUser.email,
        password: 'password123',
        name: 'Test User',
      };
      mockRequest.body = userData;

      await UserAuthController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(false);
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await createTestUser(dataSource);
      user.password = hashedPassword;
      await dataSource.getRepository(User).save(user);

      mockRequest.body = {
        email: user.email,
        password,
      };

      await UserAuthController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(true);
      expect(responseObject.data.token).toBeDefined();
      expect(responseObject.data.user.email).toBe(user.email);
    });

    it('should return 401 for invalid credentials', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await UserAuthController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(false);
    });
  });

  describe('requestPasswordReset', () => {
    it('should send password reset email for existing user', async () => {
      const user = await createTestUser(dataSource);
      mockRequest.body = { email: user.email };

      await UserAuthController.requestPasswordReset(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(true);
    });

    it('should return success even for non-existent email', async () => {
      mockRequest.body = { email: 'nonexistent@example.com' };

      await UserAuthController.requestPasswordReset(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(true);
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const user = await createTestUser(dataSource);
      const token = 'valid-reset-token'; // In real app, this would be a JWT
      const newPassword = 'newpassword123';

      mockRequest.body = {
        token,
        password: newPassword,
      };

      await UserAuthController.resetPassword(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(true);
    });

    it('should return 400 for invalid token', async () => {
      mockRequest.body = {
        token: 'invalid-token',
        password: 'newpassword123',
      };

      await UserAuthController.resetPassword(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(false);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      const user = await createTestUser(dataSource);
      const token = 'valid-verification-token'; // In real app, this would be a JWT

      mockRequest.body = { token };

      await UserAuthController.verifyEmail(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(true);
    });

    it('should return 400 for invalid token', async () => {
      mockRequest.body = { token: 'invalid-token' };

      await UserAuthController.verifyEmail(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(false);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const user = await createTestUser(dataSource);
      mockRequest.user = { id: user.id };

      await UserAuthController.getProfile(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(true);
      expect(responseObject.data.id).toBe(user.id);
      expect(responseObject.data.email).toBe(user.email);
    });

    it('should return 401 if not authenticated', async () => {
      await UserAuthController.getProfile(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(false);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const user = await createTestUser(dataSource);
      const updateData = {
        name: 'Updated Name',
        firstName: 'John',
        lastName: 'Doe',
      };
      mockRequest.user = { id: user.id };
      mockRequest.body = updateData;

      await UserAuthController.updateProfile(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(true);
      expect(responseObject.data.name).toBe(updateData.name);
      expect(responseObject.data.firstName).toBe(updateData.firstName);
      expect(responseObject.data.lastName).toBe(updateData.lastName);
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.body = { name: 'Updated Name' };

      await UserAuthController.updateProfile(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(false);
    });
  });
}); 