import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth';
import { generateRequestLogVisualization } from '../utils/requestLogVisualizer';
import path from 'path';
import fs from 'fs';

const router = Router();

// 包装异步路由处理器
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 获取API请求日志可视化图表
 * 显示典型的API请求日志，包括请求路径、响应状态、执行时间和异常堆栈
 */
router.get('/logs/visualization', requireAuth, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
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
router.get('/logs/requests', requireAuth, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
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
router.get('/logs/errors', requireAuth, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
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

export default router; 