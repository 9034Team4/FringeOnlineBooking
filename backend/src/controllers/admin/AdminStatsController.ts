import { Request, Response } from 'express';
import { AppDataSource } from '../../config/data-source';
import { User } from '../../entities/User';
import { Event } from '../../entities/Event';
import { Booking } from '../../entities/Booking';
import { Ticket, TicketType } from '../../entities/Ticket';
import { Payment } from '../../entities/Payment';

export const AdminStatsController = {
  // 1. 用户总数
  async totalUsers(req: Request, res: Response) {
    const userRepo = AppDataSource.getRepository(User);
    const total = await userRepo.count();
    res.json({ total });
  },

  // 2. 活动总数
  async totalEvents(req: Request, res: Response) {
    const eventRepo = AppDataSource.getRepository(Event);
    const total = await eventRepo.count();
    res.json({ total });
  },

  // 3. 新订单数
  async totalBookings(req: Request, res: Response) {
    const bookingRepo = AppDataSource.getRepository(Booking);
    const total = await bookingRepo.count();
    res.json({ total });
  },

  // 4. 每周收入（近7天）
  async weeklyRevenue(req: Request, res: Response) {
    const paymentRepo = AppDataSource.getRepository(Payment);
    const today = new Date();
    const days: { date: string, total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const start = new Date(day.setHours(0, 0, 0, 0));
      const end = new Date(day.setHours(23, 59, 59, 999));
      const total = await paymentRepo
        .createQueryBuilder('payment')
        .where('payment.createdAt >= :start AND payment.createdAt <= :end', { start, end })
        .select('SUM(payment.amount)', 'sum')
        .getRawOne();
      days.push({ date: start.toISOString().slice(0, 10), total: Number(total.sum) || 0 });
    }
    res.json({ days });
  },

  // 5. 票分布饼图（按类型或来源分组）
  async ticketDistribution(req: Request, res: Response) {
    const ticketRepo = AppDataSource.getRepository(Ticket);
    const systemCount = await ticketRepo.count({ where: { type: TicketType.REGULAR } });
    const userCount = await ticketRepo.count({ where: { type: TicketType.VIP } });
    res.json({
      distribution: [
        { label: 'Regular', value: systemCount },
        { label: 'VIP', value: userCount }
      ]
    });
  },

  // 6. 日流量（示例：统计订单数作为流量，实际可用访问日志表）
  async dailyTraffic(req: Request, res: Response) {
    const bookingRepo = AppDataSource.getRepository(Booking);
    const today = new Date();
    const hours: { hour: string, count: number }[] = [];
    for (let i = 0; i < 24; i++) {
      const start = new Date(today.setHours(i, 0, 0, 0));
      const end = new Date(today.setHours(i, 59, 59, 999));
      const count = await bookingRepo
        .createQueryBuilder('booking')
        .where('booking.createdAt >= :start AND booking.createdAt <= :end', { start, end })
        .getCount();
      hours.push({ hour: `${i}:00`, count });
    }
    res.json({ hours });
  }
}; 