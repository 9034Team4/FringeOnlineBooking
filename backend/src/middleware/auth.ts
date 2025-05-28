import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../entities/User';
import { authConfig } from '../config/auth';

// 扩展 Express 的 Request 类型以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * JWT 认证中间件
 * 验证请求头中的 JWT token
 */
export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, authConfig.jwtSecret, (err: any, decoded: any) => {
      if (err) {
        res.status(403).json({ message: 'Invalid token' });
        return;
      }

      req.user = decoded;
      next();
    });
  } else {
    res.status(401).json({ message: 'No token provided' });
  }
};

/**
 * 角色授权中间件
 * 验证用户是否具有所需角色
 */
export const authorizeRole = (role: UserRole) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    next();
  };
};

/**
 * 验证用户是否已登录
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  next();
};

/**
 * 验证用户是否具有所需角色
 */
export const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

/**
 * 验证用户是否是资源的所有者
 */
export const requireOwnership = (resourceType: 'booking' | 'ticket' | 'payment') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const resourceId = req.params.id;
    if (!resourceId) {
      res.status(400).json({ message: 'Resource ID is required' });
      return;
    }

    try {
      // 这里需要根据 resourceType 查询相应的资源
      // 并验证当前用户是否是资源的所有者
      // 由于这需要数据库查询，这里只是一个示例框架
      const isOwner = true; // 这里需要实现实际的验证逻辑

      if (!isOwner) {
        res.status(403).json({ message: 'Access denied' });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Error verifying ownership' });
    }
  };
};