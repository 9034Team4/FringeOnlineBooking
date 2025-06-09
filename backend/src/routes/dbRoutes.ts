import { Router, Request, Response } from 'express';
import { seed } from '../seeder';

const router = Router();

/**
 * 初始化数据库并填充种子数据
 * 不需要授权
 */
router.get('/init', async (req: Request, res: Response) => {
  try {
    console.log('开始执行数据库种子填充...');
    await seed();
    console.log('数据库种子填充成功');
    res.json({ success: true, message: '数据库初始化成功' });
  } catch (error) {
    console.error('数据库种子填充失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '数据库初始化失败', 
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router; 