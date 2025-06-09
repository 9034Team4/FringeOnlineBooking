import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import router from './routes';
import publicRoutes from './routes/publicRoutes';
import adminRoutes from './routes/adminRoutes';
import { swaggerUi, swaggerSpec } from './swagger';
import { AppDataSource } from './config/data-source';
import { connectRedis, redisClient } from './config/redis';
import path from 'path';
import mime from 'mime';
import { HealthController } from './controllers/HealthController';
import { requestLogger, errorLogger } from './middlewares/logger';
import { seed } from './seeder';

const app = express();

// 默认启用自动seed功能，可以通过环境变量DISABLE_AUTO_SEED=true禁用
const shouldAutoSeed = process.env.DISABLE_AUTO_SEED !== 'true';

AppDataSource.initialize()
.then(async () => {
  console.log('✅ MySQL connection established');
  app.set('db', AppDataSource);
  
  // 默认执行seed操作，除非明确禁用
  if (shouldAutoSeed) {
    try {
      console.log('🌱 Automatically running database seeder...');
      await seed();
      console.log('✅ Database seeded successfully');
    } catch (error) {
      console.error('❌ Error seeding database:', error);
      // 即使seed失败，也继续启动应用
      console.log('⚠️ Continuing application startup despite seeding error');
    }
  } else {
    console.log('ℹ️ Auto-seeding is disabled');
  }
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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add request logger middleware
app.use(requestLogger);

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Route mounting
// 1. Main API routes
app.use('/api', router);

// 2. Public API routes
// 只使用publicRoutes作为公共API路由
app.use('/api/public', publicRoutes);
app.use('/api/events', publicRoutes);

// 3. Admin API routes
app.use('/api/admin', adminRoutes);

// 4. Test route
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working!' });
});

// 5. Health check route
app.get('/health', (req, res) => {
  HealthController.checkStatus(req, res);
});

// 6. Static files for log visualizations
app.use('/logs/visualizations', express.static(path.join(__dirname, '../logs/visualizations')));

// 7. 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// 8. Error logger middleware (should be after routes)
app.use(errorLogger);

// Start server
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API docs available at: http://localhost:${PORT}/api-docs`);
  console.log(`API request logs will be saved to: ${path.join(__dirname, '../logs/api-requests.log')}`);
  console.log(`Log visualizations available at: http://localhost:${PORT}/api/admin/logs/visualization`);
});

