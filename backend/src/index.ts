// 首先注册模块别名，确保在导入其他模块前执行
import 'reflect-metadata';
import 'module-alias/register';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import router from './routes';
import publicRoutes from './routes/publicRoutes';
import adminRoutes from './routes/adminRoutes';
import dbRoutes from './routes/dbRoutes';
import { swaggerUi, swaggerSpec } from './swagger';
import { AppDataSource } from './config/data-source';
import { connectRedis, redisClient } from './config/redis';
import path from 'path';
import mime from 'mime';
import { HealthController } from './controllers/HealthController';
import { requestLogger, errorLogger } from './middlewares/logger';
// 导入seed函数，但不自动执行
import { seed } from './seeder';

// 设置NODE_ENV环境变量（如果未设置）
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
console.log(`Running in ${process.env.NODE_ENV} mode`);

const app = express();

AppDataSource.initialize()
.then(async () => {
  console.log('✅ MySQL connection established');
  app.set('db', AppDataSource);  
})
.catch((err) => {
  console.error('❌ MySQL connection failed:', err);
});

connectRedis().then(() => {
  console.log('✅ Redis connection established');
  app.set('redis', redisClient);
}).catch((err)=>{
  console.error("❌ Redis connection failed:", err);   
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
// 增加请求体大小限制，最大50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add request logger middleware
app.use(requestLogger);

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 静态文件服务
app.use('/public', express.static(path.join(__dirname, '../public')));

// 添加一个顶级路由，直接执行seed函数 - 确保这个路由在最前面
app.get('/init-database', async (req, res) => {
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

// Route mounting
// 1. Main API routes
app.use('/api', router);

// 2. Public API routes
// 只使用publicRoutes作为公共API路由
app.use('/api/public', publicRoutes);
app.use('/api/events', publicRoutes);

// 3. Admin API routes
app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes); // Also mount on /admin for backward compatibility

// 4. Database routes - 确保这个路由在前面
app.use('/db', dbRoutes);

// 5. Test route
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working!' });
});

// 6. Health check route
app.get('/health', (req, res) => {
  HealthController.checkStatus(req, res);
});

// 7. Static files for log visualizations
app.use('/logs/visualizations', express.static(path.join(__dirname, '../logs/visualizations')));

// 8. 提供数据库初始化工具页面
app.get('/db-init', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/db-init.html'));
});

// 添加一个直接重定向到init-db的路由
app.get('/run-seeder', (req, res) => {
  res.redirect('/api/public/init-db');
});

// 9. 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// 10. Error logger middleware (should be after routes)
app.use(errorLogger);

// Start server
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API docs available at: http://localhost:${PORT}/api-docs`);
  console.log(`API request logs will be saved to: ${path.join(__dirname, '../logs/api-requests.log')}`);
  console.log(`Log visualizations available at: http://localhost:${PORT}/api/admin/logs/visualization`);
});

