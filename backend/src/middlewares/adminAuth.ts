import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../entities/User';

// Environment check for development mode
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Admin authentication middleware with development bypass
 * This middleware is specifically for admin routes and won't affect public routes
 */
export const adminAuth = (req: Request, res: Response, next: NextFunction): void => {
  // For development, always bypass authentication
  if (isDevelopment) {
    console.log('⚠️ Development mode: Admin authentication bypassed');
    // Add mock admin user data for development
    req.user = {
      id: 'dev-admin-id',
      email: 'admin@example.com',
      role: UserRole.ADMIN
    };
    return next();
  }

  // Production mode - check for actual authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Admin authentication required',
      error: 'No token provided'
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    // Use the same JWT_SECRET as in the original auth middleware
    const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, role: string };
    
    // Check if the user is an admin
    if (decoded.role !== UserRole.ADMIN && decoded.role !== UserRole.ORGANIZER) {
      res.status(403).json({
        success: false,
        message: 'Admin access required',
        error: 'Insufficient permissions'
      });
      return;
    }
    
    // Set user info in request
    req.user = {
      id: decoded.userId,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    console.log('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Admin authentication failed',
      error: error instanceof Error ? error.message : 'Invalid token'
    });
    return;
  }
}; 