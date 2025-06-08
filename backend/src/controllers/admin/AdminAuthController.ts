import { Request, Response } from 'express';
import { adminLoginSchema } from '../../schemas/admin';
import { ZodError } from 'zod';
import { AppDataSource } from '../../config/data-source';
import { User, UserRole } from '../../entities/User';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../utils/jwt';

const userRepo = AppDataSource.getRepository(User);

export const AdminAuthController = {
  /**
   * Authenticate admin user and return JWT token
   */
  async login(req: Request, res: Response) {
    try {
      const validatedData = adminLoginSchema.parse(req.body);
      console.log('validatedData',validatedData);
      // Find admin user by email
      const admin = await userRepo.findOne({ 
        where: { 
          email: validatedData.email,
          role: UserRole.ADMIN,
          isActive: true
        } 
      });

      console.log('admin',admin);

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credential'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(validatedData.password, admin.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const token = generateToken({
        userId: admin.id,
        email: admin.email,
        role: admin.role
      });

      // Update last login timestamp
      admin.lastLogin = new Date();
      await userRepo.save(admin);

      return res.status(200).json({
        success: true,
        message: 'Admin login successful',
        data: {
          token,
          admin: {
            id: admin.id,
            email: admin.email,
            role: admin.role,
            name: admin.name,
          }
        }
      });
    } catch (err: unknown) {
      console.error('Admin login error:', err);
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          error: err.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  }
};