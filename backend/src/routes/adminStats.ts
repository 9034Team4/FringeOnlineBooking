import { Router } from 'express';
import { AdminStatsController } from '../controllers/admin/AdminStatsController';
import { requireAuth, requireRole } from '../middleware/auth';
import { UserRole } from '../entities/User';

const router = Router();
const adminOnly = [requireAuth, requireRole([UserRole.ADMIN])];

console.log('adminStats 路由已加载');

/**
 * @swagger
 * tags:
 *   name: AdminStats
 *   description: 管理员统计相关接口
 */

/**
 * @swagger
 * /admin/stats/users:
 *   get:
 *     summary: 获取用户总数
 *     tags: [AdminStats]
 *     responses:
 *       200:
 *         description: 用户总数
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 */
router.get('/users', ...adminOnly, AdminStatsController.totalUsers);

/**
 * @swagger
 * /admin/stats/events:
 *   get:
 *     summary: 获取活动总数
 *     tags: [AdminStats]
 *     responses:
 *       200:
 *         description: 活动总数
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 */
router.get('/events', ...adminOnly, AdminStatsController.totalEvents);

/**
 * @swagger
 * /admin/stats/bookings:
 *   get:
 *     summary: 获取订单总数
 *     tags: [AdminStats]
 *     responses:
 *       200:
 *         description: 订单总数
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 */
router.get('/bookings', ...adminOnly, AdminStatsController.totalBookings);

/**
 * @swagger
 * /admin/stats/revenue:
 *   get:
 *     summary: 获取近7天每周收入
 *     tags: [AdminStats]
 *     responses:
 *       200:
 *         description: 每周收入
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 days:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       total:
 *                         type: number
 */
router.get('/revenue', ...adminOnly, AdminStatsController.weeklyRevenue);

/**
 * @swagger
 * /admin/stats/ticket-distribution:
 *   get:
 *     summary: 获取票分布饼图数据
 *     tags: [AdminStats]
 *     responses:
 *       200:
 *         description: 票分布数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 distribution:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       label:
 *                         type: string
 *                       value:
 *                         type: integer
 */
router.get('/ticket-distribution', ...adminOnly, AdminStatsController.ticketDistribution);

/**
 * @swagger
 * /admin/stats/traffic:
 *   get:
 *     summary: 获取日流量统计
 *     tags: [AdminStats]
 *     responses:
 *       200:
 *         description: 日流量数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hours:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       hour:
 *                         type: string
 *                       count:
 *                         type: integer
 */
router.get('/traffic', ...adminOnly, AdminStatsController.dailyTraffic);

router.get('/admin/stats/test', (req, res) => {
  res.json({ msg: 'admin stats test ok' });
});

export default router; 