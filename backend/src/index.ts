import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import router from './routes';
import { swaggerUi, swaggerSpec } from './swagger';
import { AppDataSource } from './config/db';
import { connectRedis, redisClient } from './config/redis';
import path from 'path';
import mime from 'mime';
import { HealthController } from './controllers/HealthController';

const app = express();

AppDataSource.initialize()
.then(() => {
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 1️⃣ 静态资源必须优先
// app.use('/admin', express.static(path.join(__dirname, '../../frontend-admin/dist')));
// app.use('/usr', express.static(path.join(__dirname, '../../frontend-public/dist')));
//app.use('/', express.static(path.join(__dirname, '../../frontend-public/dist')));

// 2️⃣ API 路由
app.use('/api', router);



// // 3️⃣ SPA 路由 fallback：只处理浏览器直输路径，如 /usr/events，而不是 /js/xxx
// app.get('/admin/', (req, res) => {
//   res.sendFile(path.join(__dirname, '../../frontend-admin/dist/index.html'));
// });

// app.get('/usr/*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../../frontend-public/dist/index.html'));
// });

// // // 可选：根目录 fallback
// app.get('/*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../../frontend-public/dist/index.html'));
// });

// 4️⃣ 最后的 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  
});

