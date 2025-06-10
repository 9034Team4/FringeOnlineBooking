import { Router, Request, Response, NextFunction } from 'express';
import { adminAuth } from '../middlewares/adminAuth';
import { generateRequestLogVisualization } from '../utils/requestLogVisualizer';
import path from 'path';
import fs from 'fs';
import { DatabaseController } from '../controllers/DatabaseController';
import { EventController } from '../controllers/admin/EventController';
import { SeatController } from '../controllers/admin/SeatController';
import { VenueController } from '../controllers/admin/VenueController';
import { UploadController } from '../controllers/admin/UploadController';
import { UserRole } from '../entities/User';
import { AdminStatsController } from '../controllers/admin/AdminStatsController';

const router = Router();

// 包装异步路由处理器
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 初始化数据库并填充种子数据
 * 注意：此API不需要身份验证，但需要管理员密钥
 */
router.post('/database/initialize', asyncHandler(async (req: Request, res: Response) => {
  await DatabaseController.initializeDatabase(req, res);
}));

/**
 * 检查数据库连接状态
 */
router.get('/database/status', asyncHandler(async (req: Request, res: Response) => {
  await DatabaseController.checkDatabaseStatus(req, res);
}));

/**
 * 获取API请求日志可视化图表
 * 显示典型的API请求日志，包括请求路径、响应状态、执行时间和异常堆栈
 */
router.get('/logs/visualization', adminAuth, asyncHandler(async (req: Request, res: Response) => {
  // 生成可视化图表
  const outputPath = await generateRequestLogVisualization();
  
  if (!outputPath || !fs.existsSync(outputPath)) {
    return res.status(404).json({
      success: false,
      message: 'Failed to generate log visualization'
    });
  }
  
  // 返回图表文件
  return res.sendFile(outputPath);
}));

/**
 * 获取最新的API请求日志
 */
router.get('/logs/requests', adminAuth, asyncHandler(async (req: Request, res: Response) => {
  const logFilePath = path.join(__dirname, '../../logs/api-requests.log');
  
  if (!fs.existsSync(logFilePath)) {
    return res.status(404).json({
      success: false,
      message: 'Log file not found'
    });
  }
  
  // 读取最新的日志条目
  const logContent = fs.readFileSync(logFilePath, 'utf8');
  const logEntries = logContent
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line))
    .slice(-100); // 获取最近100条日志
  
  return res.json({
    success: true,
    message: 'API request logs retrieved successfully',
    data: logEntries
  });
}));

/**
 * 获取错误日志
 */
router.get('/logs/errors', adminAuth, asyncHandler(async (req: Request, res: Response) => {
  const errorLogFilePath = path.join(__dirname, '../../logs/api-errors.log');
  
  if (!fs.existsSync(errorLogFilePath)) {
    return res.status(404).json({
      success: false,
      message: 'Error log file not found'
    });
  }
  
  // 读取最新的错误日志条目
  const logContent = fs.readFileSync(errorLogFilePath, 'utf8');
  const logEntries = logContent
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line))
    .slice(-50); // 获取最近50条错误日志
  
  return res.json({
    success: true,
    message: 'API error logs retrieved successfully',
    data: logEntries
  });
}));

// ================= File Upload =================
/**
 * Upload an image file
 * 开发环境下不验证权限，方便测试
 */
router.post('/upload', (req: Request, res: Response) => {
  UploadController.uploadImage(req, res);
});

// ================= Admin Event Management =================
/**
 * Get all events (admin)
 */
router.get('/events', adminAuth, (req: Request, res: Response) => {
  EventController.getAll(req, res);
});

/**
 * Create a new event
 */
router.post('/events', adminAuth, (req: Request, res: Response) => {
  EventController.create(req, res);
});

/**
 * Get an event by ID
 */
router.get('/events/:id', adminAuth, (req: Request, res: Response) => {
  EventController.getById(req, res);
});

/**
 * Get seats for an event
 * 临时移除认证要求，方便测试
 */
router.get('/events/:eventId/seats', (req: Request, res: Response) => {
  SeatController.getByEventId(req, res);
});

/**
 * Update an event
 */
router.put('/events/:id', adminAuth, (req: Request, res: Response) => {
  EventController.update(req, res);
});

/**
 * Delete an event
 */
router.delete('/events/:id', adminAuth, (req: Request, res: Response) => {
  EventController.remove(req, res);
});

// ================= Admin Venue Management =================
/**
 * Get all venues
 */
router.get('/venues', adminAuth, (req: Request, res: Response) => {
  VenueController.getAll(req, res);
});

/**
 * Create a new venue
 */
router.post('/venues', adminAuth, (req: Request, res: Response) => {
  VenueController.create(req, res);
});

/**
 * Get venue by ID
 */
router.get('/venues/:id', adminAuth, (req: Request, res: Response) => {
  VenueController.getById(req, res);
});

/**
 * Update a venue
 */
router.put('/venues/:id', adminAuth, (req: Request, res: Response) => {
  VenueController.update(req, res);
});

/**
 * Delete a venue
 */
router.delete('/venues/:id', adminAuth, (req: Request, res: Response) => {
  VenueController.remove(req, res);
});

/**
 * Get events by venue ID
 */
router.get('/venues/:venueId/events', adminAuth, (req: Request, res: Response) => {
  VenueController.getEventsByVenueId(req, res);
});

// ================= Admin Seat Management =================
/**
 * Get seats by venue
 */
router.get('/venues/:venueId/seats', adminAuth, (req: Request, res: Response) => {
  SeatController.getByVenue(req, res);
});

/**
 * Create a new seat
 */
router.post('/seats', adminAuth, (req: Request, res: Response) => {
  SeatController.create(req, res);
});

/**
 * Release expired seat locks
 */
router.post('/seats/release-expired', adminAuth, (req: Request, res: Response) => {
  SeatController.releaseExpiredLocks(req, res);
});

/**
 * Release specific seat locks
 */
router.post('/seats/release', (req: Request, res: Response) => {
  SeatController.releaseUserLocks(req, res);
});

// ================= Admin Statistics =================
/**
 * Get user statistics
 */
router.get('/stats/users', adminAuth, (req: Request, res: Response) => {
  AdminStatsController.totalUsers(req, res);
});

/**
 * Get event statistics
 */
router.get('/stats/events', adminAuth, (req: Request, res: Response) => {
  AdminStatsController.totalEvents(req, res);
});

/**
 * Get booking statistics
 */
router.get('/stats/bookings', adminAuth, (req: Request, res: Response) => {
  AdminStatsController.totalBookings(req, res);
});

/**
 * Get revenue statistics
 */
router.get('/stats/revenue', adminAuth, (req: Request, res: Response) => {
  AdminStatsController.revenue(req, res);
});

/**
 * Get ticket distribution statistics
 */
router.get('/stats/ticket-distribution', adminAuth, (req: Request, res: Response) => {
  AdminStatsController.ticketDistribution(req, res);
});

/**
 * Get traffic statistics
 */
router.get('/stats/traffic', adminAuth, (req: Request, res: Response) => {
  AdminStatsController.traffic(req, res);
});

export default router; 