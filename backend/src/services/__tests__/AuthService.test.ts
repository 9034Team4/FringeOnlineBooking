import { AuthService } from '../AuthService';
import { User, UserRole } from '../../entities/User';
import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

jest.mock('typeorm');
jest.mock('../../config/data-source');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
    let authService: AuthService;
    let mockUserRepository: jest.Mocked<Repository<User>>;

    beforeEach(() => {
        mockUserRepository = {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
        } as any;

        (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
            if (entity === User) return mockUserRepository;
            return null;
        });

        authService = new AuthService();
    });

    describe('register', () => {
        it('should register a new user successfully', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'test@example.com',
                password: 'hashedPassword',
                firstName: 'John',
                lastName: 'Doe',
                role: UserRole.USER,
            } as User;

            mockUserRepository.findOne.mockResolvedValue(null);
            mockUserRepository.create.mockReturnValue(mockUser);
            mockUserRepository.save.mockResolvedValue(mockUser);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

            const result = await authService.register({
                email: 'test@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe',
                role: UserRole.USER,
            });

            expect(result).toEqual(mockUser);
            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
            expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
        });

        it('should throw error if email already exists', async () => {
            const existingUser = {
                id: 'user-1',
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe',
            } as User;

            mockUserRepository.findOne.mockResolvedValue(existingUser);

            await expect(
                authService.register({
                    email: 'test@example.com',
                    password: 'password123',
                    firstName: 'John',
                    lastName: 'Doe',
                    role: UserRole.USER,
                })
            ).rejects.toThrow('Email already exists');
        });

        it('should throw error if password is too short', async () => {
            await expect(
                authService.register({
                    email: 'test@example.com',
                    password: '123',
                    firstName: 'John',
                    lastName: 'Doe',
                    role: UserRole.USER,
                })
            ).rejects.toThrow('Password must be at least 6 characters long');
        });
    });

    describe('login', () => {
        it('should login user successfully', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'test@example.com',
                password: 'hashedPassword',
                firstName: 'John',
                lastName: 'Doe',
                role: UserRole.USER,
            } as User;

            mockUserRepository.findOne.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (jwt.sign as jest.Mock).mockReturnValue('mockToken');

            const result = await authService.login('test@example.com', 'password123');

            expect(result).toEqual({
                token: 'mockToken',
                user: mockUser,
            });
            expect(jwt.sign).toHaveBeenCalledWith(
                { userId: 'user-1', role: UserRole.USER },
                'test-secret',
                { expiresIn: '24h' }
            );
        });

        it('should throw error if user not found', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            await expect(
                authService.login('test@example.com', 'password123')
            ).rejects.toThrow('Invalid credentials');
        });

        it('should throw error if password is incorrect', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'test@example.com',
                password: 'hashedPassword',
                firstName: 'John',
                lastName: 'Doe',
            } as User;

            mockUserRepository.findOne.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(
                authService.login('test@example.com', 'wrongPassword')
            ).rejects.toThrow('Invalid credentials');
        });
    });

    describe('getUserProfile', () => {
        it('should return user profile', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe',
                role: UserRole.USER,
            } as User;

            mockUserRepository.findOne.mockResolvedValue(mockUser);

            const result = await authService.getUserProfile('user-1');

            expect(result).toEqual(mockUser);
            expect(mockUserRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'user-1' },
            });
        });

        it('should throw error if user not found', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            await expect(
                authService.getUserProfile('user-1')
            ).rejects.toThrow('User not found');
        });
    });

    describe('updateUserProfile', () => {
        it('should update user profile successfully', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe',
                role: UserRole.USER,
            } as User;

            mockUserRepository.findOne.mockResolvedValue(mockUser);
            mockUserRepository.save.mockResolvedValue({
                ...mockUser,
                email: 'new@example.com',
            });

            const result = await authService.updateUserProfile('user-1', {
                email: 'new@example.com',
            });

            expect(result.email).toBe('new@example.com');
            expect(mockUserRepository.save).toHaveBeenCalled();
        });

        it('should throw error if user not found', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            await expect(
                authService.updateUserProfile('user-1', {
                    email: 'new@example.com',
                })
            ).rejects.toThrow('User not found');
        });

        it('should throw error if email already exists', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe',
            } as User;

            const existingUser = {
                id: 'user-2',
                email: 'new@example.com',
                firstName: 'Jane',
                lastName: 'Smith',
            } as User;

            mockUserRepository.findOne
                .mockResolvedValueOnce(mockUser)
                .mockResolvedValueOnce(existingUser);

            await expect(
                authService.updateUserProfile('user-1', {
                    email: 'new@example.com',
                })
            ).rejects.toThrow('Email already exists');
        });
    });

    describe('changePassword', () => {
        it('should change password successfully', async () => {
            const mockUser = {
                id: 'user-1',
                password: 'hashedPassword',
                firstName: 'John',
                lastName: 'Doe',
            } as User;

            mockUserRepository.findOne.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
            mockUserRepository.save.mockResolvedValue({
                ...mockUser,
                password: 'newHashedPassword',
            });

            await authService.changePassword('user-1', 'oldPassword', 'newPassword');

            expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
            expect(mockUserRepository.save).toHaveBeenCalled();
        });

        it('should throw error if user not found', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            await expect(
                authService.changePassword('user-1', 'oldPassword', 'newPassword')
            ).rejects.toThrow('User not found');
        });

        it('should throw error if current password is incorrect', async () => {
            const mockUser = {
                id: 'user-1',
                password: 'hashedPassword',
                firstName: 'John',
                lastName: 'Doe',
            } as User;

            mockUserRepository.findOne.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(
                authService.changePassword('user-1', 'wrongPassword', 'newPassword')
            ).rejects.toThrow('Current password is incorrect');
        });

        it('should throw error if new password is too short', async () => {
            const mockUser = {
                id: 'user-1',
                password: 'hashedPassword',
                firstName: 'John',
                lastName: 'Doe',
            } as User;

            mockUserRepository.findOne.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            await expect(
                authService.changePassword('user-1', 'oldPassword', '123')
            ).rejects.toThrow('Password must be at least 6 characters long');
        });
    });
}); 