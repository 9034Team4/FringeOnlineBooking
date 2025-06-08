import { AppDataSource } from '../../config/data-source';
import { User, UserRole } from '../../entities/User';
import bcryptjs from 'bcryptjs';
import { Request, Response } from 'express';
import { generateToken } from '../../utils/jwt';
import { ZodError } from 'zod';
import {
  userRegisterSchema,
  userLoginSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  verifyEmailSchema
} from '../../schemas/auth';

const userRepo = AppDataSource.getRepository(User);

// 简单的密码强度验证
const isPasswordStrong = (password: string): boolean => {
  // 至少8个字符，包含数字和字母
  return password.length >= 8 && /[0-9]/.test(password) && /[a-zA-Z]/.test(password);
};

export const UserAuthController = {
  /**
   * Register a new user
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // 基本输入验证
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
        return;
      }

      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
        return;
      }

      // 验证密码强度
      if (!isPasswordStrong(password)) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long and contain both letters and numbers'
        });
        return;
      }

      // 检查邮箱是否已存在
      const existingUser = await userRepo.findOne({ where: { email } });
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
        return;
      }

      // 加密密码
      const hashedPassword = await bcryptjs.hash(password, 10);

      // 创建新用户
      const user = userRepo.create({
        email,
        password: hashedPassword,
        name: email.split('@')[0], // 使用邮箱前缀作为默认名称
        role: UserRole.USER,
        isVerified: true // 简化流程，默认已验证
      });

      await userRepo.save(user);

      // 生成 JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }
      });
    } catch (err: unknown) {
      console.error('Error registering user:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to register user',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Login user
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // 基本输入验证
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
        return;
      }

      // 查找用户
      const user = await userRepo.findOne({ where: { email } });
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
        return;
      }

      // 验证密码
      const isValidPassword = await bcryptjs.compare(password, user.password);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
        return;
      }

      // 生成 JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // 更新最后登录时间
      user.lastLogin = new Date();
      await userRepo.save(user);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }
      });
    } catch (err: unknown) {
      console.error('Error logging in:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to login',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = resetPasswordRequestSchema.parse(req.body);
      const { email } = validatedData;

      const user = await userRepo.findOne({ where: { email } });
      if (!user) {
        // Return success even if user doesn't exist for security
        res.status(200).json({
          success: true,
          message: 'If an account exists with this email, you will receive a password reset link'
        });
        return;
      }

      // Generate reset token
      const resetToken = generateToken({ userId: user.id });

      // TODO: Send password reset email

      res.status(200).json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link'
      });
    } catch (err: unknown) {
      console.error('Error requesting password reset:', err);
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid input data',
          error: err.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to process password reset request',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Reset password
   */
  async resetPassword(req: Request, res: Response) {
    try {
      const validatedData = resetPasswordSchema.parse(req.body);
      const { token, password } = validatedData;

      // TODO: Verify token and get user ID
      const userId = 'user-id-from-token';

      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
        return;
      }

      // Hash new password
      const hashedPassword = await bcryptjs.hash(password, 10);

      // Update password
      user.password = hashedPassword;
      await userRepo.save(user);

      res.status(200).json({
        success: true,
        message: 'Password has been reset successfully'
      });
    } catch (err: unknown) {
      console.error('Error resetting password:', err);
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid input data',
          error: err.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to reset password',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Verify email
   */
  async verifyEmail(req: Request, res: Response) {
    try {
      const validatedData = verifyEmailSchema.parse(req.body);
      const { token } = validatedData;

      // TODO: Verify token and get user ID
      const userId = 'user-id-from-token';

      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired verification token'
        });
        return;
      }

      // Update email verification status
      user.isVerified = true;
      await userRepo.save(user);

      res.status(200).json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (err: unknown) {
      console.error('Error verifying email:', err);
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid input data',
          error: err.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to verify email',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Simulate sending an email notification (new endpoint)
   */
  async sendEmailNotification(req: Request, res: Response) {
    try {
      const { to, subject, content } = req.body;
      if (!to || !subject || !content) {
        res.status(400).json({ success: false, message: 'Missing required fields', error: null });
        return;
      }
      // TODO: Integrate with real email service
      // For now, just log the email
      console.log('Simulated email sent:', { to, subject, content });
      res.status(200).json({
        success: true,
        message: 'Email notification sent (simulated)',
        data: { to, subject }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to send email notification', error: err.message });
    }
  },

  /**
   * Get current user profile (real DB logic)
   */
  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required', error: null });
        return;
      }
      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found', error: null });
        return;
      }
      const { password, ...userData } = user;
      res.status(200).json({ success: true, message: 'User profile retrieved', data: userData });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to get profile', error: err.message });
    }
  },

  /**
   * Update user profile (real DB logic)
   */
  async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required', error: null });
        return;
      }
      const { name, firstName, lastName, avatar } = req.body;
      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found', error: null });
        return;
      }
      if (name !== undefined) user.name = name;
      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
      if (avatar !== undefined) user.avatar = avatar;
      await userRepo.save(user);
      const { password, ...userData } = user;
      res.status(200).json({ success: true, message: 'Profile updated', data: userData });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to update profile', error: err.message });
    }
  },

  /**
   * Change user password (real DB logic)
   */
  async changePassword(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required', error: null });
        return;
      }
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        res.status(400).json({ success: false, message: 'Missing oldPassword or newPassword', error: null });
        return;
      }
      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found', error: null });
        return;
      }
      const isValid = await bcryptjs.compare(oldPassword, user.password);
      if (!isValid) {
        res.status(400).json({ success: false, message: 'Old password is incorrect', error: null });
        return;
      }
      user.password = await bcryptjs.hash(newPassword, 10);
      await userRepo.save(user);
      res.status(200).json({ success: true, message: 'Password changed successfully', data: null });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to change password', error: err.message });
    }
  }
};