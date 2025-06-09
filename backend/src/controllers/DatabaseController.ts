import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { seed } from '../seeder';

/**
 * 数据库控制器，提供数据库初始化和种子数据填充的API
 */
export class DatabaseController {
  /**
   * 初始化数据库并填充种子数据
   */
  static async initializeDatabase(req: Request, res: Response) {
    try {
      // 检查是否有管理员密钥
      const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
      
      // 验证管理员密钥 (生产环境应使用环境变量中的安全密钥)
      const validAdminKey = process.env.ADMIN_KEY || 'fringe2025-admin-key';
      
      if (adminKey !== validAdminKey) {
        return res.status(401).json({
          success: false,
          message: '未授权的访问，需要有效的管理员密钥'
        });
      }
      
      // 执行种子数据填充 - 这里不需要手动初始化数据库，因为seed函数会处理
      console.log('开始填充种子数据...');
      await seed();
      console.log('种子数据填充成功');
      
      return res.status(200).json({
        success: true,
        message: '数据库已初始化并填充种子数据'
      });
    } catch (error) {
      console.error('数据库初始化或种子数据填充失败:', error);
      return res.status(500).json({
        success: false,
        message: '数据库初始化或种子数据填充失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * 检查数据库连接状态
   */
  static async checkDatabaseStatus(req: Request, res: Response) {
    try {
      const isConnected = AppDataSource.isInitialized;
      
      return res.status(200).json({
        success: true,
        isConnected,
        message: isConnected ? '数据库已连接' : '数据库未连接'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: '检查数据库状态失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
} 