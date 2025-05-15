import { AppDataSource } from '../../config/db';
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

export const UserAuthController = {
  /**
   * Register a new user
   */
  async register(req: Request, res: Response) {
    try {
      const validatedData = userRegisterSchema.parse(req.body);
      const { email, password, firstName, lastName, name } = validatedData;

      // Check if user already exists
      const existingUser = await userRepo.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcryptjs.hash(password, 10);

      // Create new user
      const user = userRepo.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        name: name || `${firstName} ${lastName}`,
        role: UserRole.USER,
        isVerified: false
      });

      await userRepo.save(user);

      // Generate verification token
      const verificationToken = generateToken({ userId: user.id });

      // TODO: Send verification email

      return res.status(201).json({
        success: true,
        message: 'User registered successfully. Please verify your email.',
        data: {
          userId: user.id,
          email: user.email,
          name: user.name
        }
      });
    } catch (err: unknown) {
      console.error('Error registering user:', err);
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          error: err.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to register user',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Login user
   */
  async login(req: Request, res: Response) {
    try {
      const validatedData = userLoginSchema.parse(req.body);
      const { email, password } = validatedData;

      // Find user
      const user = await userRepo.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Verify password
      const isValidPassword = await bcryptjs.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if email is verified
      if (!user.isVerified) {
        return res.status(403).json({
          success: false,
          message: 'Please verify your email before logging in'
        });
      }

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // Update last login
      user.lastLogin = new Date();
      await userRepo.save(user);

      return res.status(200).json({
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
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          error: err.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to login',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(req: Request, res: Response) {
    try {
      const validatedData = resetPasswordRequestSchema.parse(req.body);
      const { email } = validatedData;

      const user = await userRepo.findOne({ where: { email } });
      if (!user) {
        // Return success even if user doesn't exist for security
        return res.status(200).json({
          success: true,
          message: 'If an account exists with this email, you will receive a password reset link'
        });
      }

      // Generate reset token
      const resetToken = generateToken({ userId: user.id });

      // TODO: Send password reset email

      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link'
      });
    } catch (err: unknown) {
      console.error('Error requesting password reset:', err);
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          error: err.message
        });
      }
      return res.status(500).json({
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
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }

      // Hash new password
      const hashedPassword = await bcryptjs.hash(password, 10);

      // Update password
      user.password = hashedPassword;
      await userRepo.save(user);

      return res.status(200).json({
        success: true,
        message: 'Password has been reset successfully'
      });
    } catch (err: unknown) {
      console.error('Error resetting password:', err);
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          error: err.message
        });
      }
      return res.status(500).json({
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
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification token'
        });
      }

      // Update email verification status
      user.isVerified = true;
      await userRepo.save(user);

      return res.status(200).json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (err: unknown) {
      console.error('Error verifying email:', err);
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          error: err.message
        });
      }
      return res.status(500).json({
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
        return res.status(400).json({ success: false, message: 'Missing required fields', error: null });
      }
      // TODO: Integrate with real email service
      // For now, just log the email
      console.log('Simulated email sent:', { to, subject, content });
      return res.status(200).json({
        success: true,
        message: 'Email notification sent (simulated)',
        data: { to, subject }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to send email notification', error: err.message });
    }
  },

  /**
   * Get current user profile (real DB logic)
   */
  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required', error: null });
      }
      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found', error: null });
      }
      const { password, ...userData } = user;
      return res.status(200).json({ success: true, message: 'User profile retrieved', data: userData });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to get profile', error: err.message });
    }
  },

  /**
   * Update user profile (real DB logic)
   */
  async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required', error: null });
      }
      const { name, firstName, lastName, avatar } = req.body;
      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found', error: null });
      }
      if (name !== undefined) user.name = name;
      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
      if (avatar !== undefined) user.avatar = avatar;
      await userRepo.save(user);
      const { password, ...userData } = user;
      return res.status(200).json({ success: true, message: 'Profile updated', data: userData });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to update profile', error: err.message });
    }
  },

  /**
   * Change user password (real DB logic)
   */
  async changePassword(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required', error: null });
      }
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Missing oldPassword or newPassword', error: null });
      }
      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found', error: null });
      }
      const isValid = await bcryptjs.compare(oldPassword, user.password);
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Old password is incorrect', error: null });
      }
      user.password = await bcryptjs.hash(newPassword, 10);
      await userRepo.save(user);
      return res.status(200).json({ success: true, message: 'Password changed successfully', data: null });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to change password', error: err.message });
    }
  }
};