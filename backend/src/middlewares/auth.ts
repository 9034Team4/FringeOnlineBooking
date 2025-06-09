import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { authConfig } from '../config/auth';

// JWT secret from config
const JWT_SECRET = authConfig.jwtSecret;

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any; // 使用any类型以避免与其他定义冲突
    }
  }
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'No token provided'
      });
      return;
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'Invalid token format'
      });
      return;
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      
      // 从数据库获取用户信息
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: decoded.userId } });
      
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Authentication failed',
          error: 'User not found'
        });
        return;
      }
      
      // 将用户信息附加到请求对象上
      req.user = user;
      
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401).json({
        success: false,
        message: 'Authentication failed',
        error: 'Invalid or expired token'
      });
      return;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    next(error);
  }
};

/**
 * Middleware to verify if the user is an admin
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 确保用户已经通过认证
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'User not authenticated'
      });
      return;
    }
    
    // 检查用户是否为管理员
    const user = req.user;
    
    // 如果用户对象中没有role字段，则从数据库中获取
    if (!user.role) {
      const userRepository = AppDataSource.getRepository(User);
      const dbUser = await userRepository.findOne({ where: { id: user.id } });
      
      if (!dbUser) {
        res.status(401).json({
          success: false,
          message: 'Authentication failed',
          error: 'User not found'
        });
        return;
      }
      
      user.role = dbUser.role;
    }
    
    // 检查用户角色是否为管理员
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'Admin privileges required'
      });
      return;
    }
    
    // 用户是管理员，允许访问
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking admin status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 