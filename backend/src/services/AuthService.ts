import { AppDataSource } from '../config/data-source';
import { User, UserRole } from '../entities/User';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
}

interface LoginResponse {
    token: string;
    user: User;
}

export class AuthService {
    private userRepository: Repository<User>;

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
    }

    async register(data: RegisterData): Promise<User> {
        const existingUser = await this.userRepository.findOne({ where: { email: data.email } });
        if (existingUser) {
            throw new Error('Email already exists');
        }

        if (data.password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = new User();
        Object.assign(user, {
            ...data,
            password: hashedPassword,
            role: data.role || UserRole.USER
        });

        return this.userRepository.save(user);
    }

    async login(email: string, password: string): Promise<LoginResponse> {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '24h' }
        );

        return { token, user };
    }

    async getUserProfile(userId: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }

    async updateUserProfile(userId: string, data: Partial<User>): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }

        if (data.email && data.email !== user.email) {
            const existingUser = await this.userRepository.findOne({ where: { email: data.email } });
            if (existingUser) {
                throw new Error('Email already exists');
            }
        }

        Object.assign(user, data);
        return this.userRepository.save(user);
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }

        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            throw new Error('Current password is incorrect');
        }

        if (newPassword.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await this.userRepository.save(user);
    }
}
