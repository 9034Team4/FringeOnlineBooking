import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { eventQuerySchema } from '../../schemas/event';
import { AppDataSource } from '../../config/data-source';
import { Event, EventStatus } from '../../entities/Event';
import { Seat, SeatStatus } from '../../entities/Seat';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

const eventRepo = AppDataSource.getRepository(Event);
const seatRepo = AppDataSource.getRepository(Seat);

// 初始化Redis客户端
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

// Redis键前缀
const SEAT_LOCK_PREFIX = 'seat:lock:';
const SEAT_LOCK_TTL = 600; // 锁定时间，单位：秒 (10分钟)

export const PublicEventController = {
  /**
   * List events with pagination and filtering (real DB logic)
   */
  async listEvents(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, category, status, organizer } = req.query;
      const where: any = {};
      if (category) where.category = category;
      if (status) where.status = status;
      if (organizer) where.organizer = { id: organizer };
      const [events, total] = await eventRepo.findAndCount({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        relations: ['venue', 'category', 'organizer']
      });
      return res.status(200).json({
        success: true,
        message: 'Events retrieved successfully',
        data: {
          items: events,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to fetch events', error: err.message });
    }
  },

  /**
   * Get detailed information about a specific event
   */
  async getEventDetails(req: Request, res: Response) {
    try {
      // 设置缓存控制头，确保不使用缓存
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      
      const { id } = req.params;

      // 从数据库获取事件详情
      const event = await eventRepo.findOne({
        where: { id },
        relations: [
          'venue', 
          'category', 
          'organizer',
          'tickets'
        ]
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      // 返回真实数据
      return res.status(200).json({
        success: true,
        message: 'Event details retrieved successfully',
        data: event
      });
    } catch (err: unknown) {
      console.error('Error fetching event details:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve event details',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Search and filter events (new endpoint)
   */
  async searchEvents(req: Request, res: Response) {
    try {
      // 设置缓存控制头，确保不使用缓存
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      
      const { keyword, category, priceRange, dateRange, sortBy, page = 1, limit = 10 } = req.query;
      
      // 构建查询条件
      const queryBuilder = eventRepo.createQueryBuilder('event')
        .leftJoinAndSelect('event.venue', 'venue')
        .leftJoinAndSelect('event.category', 'category')
        .leftJoinAndSelect('event.organizer', 'organizer');
      
      // 添加关键词搜索
      if (keyword) {
        queryBuilder.andWhere(
          '(event.name LIKE :keyword OR event.description LIKE :keyword OR venue.name LIKE :keyword)',
          { keyword: `%${keyword}%` }
        );
      }
      
      // 添加分类过滤
      if (category) {
        queryBuilder.andWhere('category.id = :categoryId', { categoryId: category });
      }
      
      // 添加分页
      queryBuilder
        .skip((Number(page) - 1) * Number(limit))
        .take(Number(limit));
      
      // 执行查询
      const [events, total] = await queryBuilder.getManyAndCount();
      
      return res.status(200).json({
        success: true,
        message: 'Events search results',
        data: {
          items: events,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to search events', error: err.message });
    }
  },

  /**
   * Get seats information for an event
   * Returns all seats in the venue and their current status
   */
  async getEventSeats(req: Request, res: Response): Promise<Response> {
    try {
      // 设置缓存控制头，确保不使用缓存
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      
      const { eventId } = req.params;
      console.log(`Getting seats for event: ${eventId}`);

      // Check if event exists
      const event = await eventRepo.findOne({
        where: { id: eventId },
        relations: ['venue']
      });

      if (!event) {
        console.log('Event not found');
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      console.log(`Event found: ${event.id}, Venue: ${event.venue?.id || 'No venue'}, Name: ${event.name}`);

      // Get venue ID from event
      const venueId = event.venue?.id;
      
      if (!venueId) {
        console.log('Venue not found for this event');
        return res.status(404).json({
          success: false,
          message: 'Venue not found for this event'
        });
      }
      
      // 创建固定的10×12座位排布
      const rowCount = 10; // 10行
      const colCount = 12; // 12列
      const totalSeats = rowCount * colCount; // 总座位数
      
      // 直接获取与事件关联的座位
      console.log(`Searching for seats with event ID: ${eventId}`);
      const eventSeats = await seatRepo.find({
        where: { event: { id: eventId } },
        order: {
          row: 'ASC',
          seatNumber: 'ASC'
        }
      });
      
      console.log(`Found ${eventSeats.length} event-specific seats for event: ${eventId}`);
      
      // 创建事件座位的映射，用于快速查找
      const eventSeatMap = new Map();
      eventSeats.forEach(seat => {
        const key = `${seat.row}-${seat.seatNumber}`;
        eventSeatMap.set(key, seat);
      });
      
      // 获取Redis中所有临时锁定的座位
      const lockedSeatsKeys = await redis.keys(`${SEAT_LOCK_PREFIX}${eventId}:*`);
      const temporaryLockedSeats = new Map();
      
      // 如果有临时锁定的座位，获取它们的详细信息
      if (lockedSeatsKeys.length > 0) {
        console.log(`Found ${lockedSeatsKeys.length} locked seats in Redis for event: ${eventId}`);
        for (const key of lockedSeatsKeys) {
          const seatInfo = await redis.get(key);
          if (seatInfo) {
            const { row, seatNumber } = JSON.parse(seatInfo);
            temporaryLockedSeats.set(`${row}-${seatNumber}`, true);
          }
        }
      }
      
      // 创建固定的10×12座位排布
      const seatMap: {
        eventId: string;
        venueName: string;
        rows: Record<string, Array<{
          id: number;
          seatNumber: string;
          status: SeatStatus;
          price: number;
          type: string;
          isAccessible: boolean;
        }>>;
        legend: {
          available: string;
          locked: string;
          booked: string;
          unavailable: string;
        };
        stats: {
          totalRows: number;
          maxColumns: number;
          totalSeats: number;
          availableSeats: number;
          bookedSeats: number;
          lockedSeats: number;
          unavailableSeats: number;
        };
      } = {
        eventId,
        venueName: event.venue?.name || 'Unknown Venue',
        rows: {},
        legend: {
          available: 'Available',
          locked: 'Locked',
          booked: 'Booked',
          unavailable: 'Unavailable'
        },
        stats: {
          totalRows: rowCount,
          maxColumns: colCount,
          totalSeats: totalSeats,
          availableSeats: totalSeats, // 默认所有座位可用，后面会更新
          bookedSeats: 0,
          lockedSeats: 0,
          unavailableSeats: 0
        }
      };
      
      // 初始化统计数据
      let availableSeats = totalSeats;
      let bookedSeats = 0;
      let lockedSeats = 0;
      let unavailableSeats = 0;
      
      // 创建10×12的座位排布
      for (let row = 1; row <= rowCount; row++) {
        const rowKey = String.fromCharCode(64 + row); // A, B, C, D, E...
        seatMap.rows[rowKey] = [];
        
        for (let col = 1; col <= colCount; col++) {
          const seatNumber = col.toString();
          const key = `${rowKey}-${seatNumber}`;
          
          // 检查这个座位是否存在于事件座位中
          const eventSeat = eventSeatMap.get(key);
          
          // 确定座位状态
          let status = SeatStatus.AVAILABLE;
          let price = event.basePrice || 100;
          let type = 'standard';
          let isAccessible = false;
          
          // 如果找到了对应的事件座位，使用它的信息
          if (eventSeat) {
            status = eventSeat.status;
            // 使用事件基础价格，而不是座位特定价格
            price = event.basePrice || 100;
            type = eventSeat.type;
            isAccessible = eventSeat.isAccessible;
          }
          
          // 检查座位是否被临时锁定
          if (temporaryLockedSeats.has(key)) {
            status = SeatStatus.LOCKED;
          }
          
          // 添加一些VIP和轮椅座位类型，但价格保持一致
          if (!eventSeat) {
            if (row <= 2 && (col >= 4 && col <= 9)) {
              type = 'vip';
              // 使用事件基础价格
              price = event.basePrice || 100;
            } else if ((row === rowCount && (col === 1 || col === colCount)) || 
                      (row === 1 && (col === 1 || col === colCount))) {
              type = 'wheelchair';
              isAccessible = true;
              // 使用事件基础价格
              price = event.basePrice || 100;
            }
          }
          
          // 更新统计数据
          switch (status) {
            case SeatStatus.AVAILABLE:
              break; // 默认已经计入可用座位
            case SeatStatus.BOOKED:
              availableSeats--;
              bookedSeats++;
              break;
            case SeatStatus.LOCKED:
              availableSeats--;
              lockedSeats++;
              break;
            case SeatStatus.UNAVAILABLE:
              availableSeats--;
              unavailableSeats++;
              break;
          }
          
          // 添加座位到行中
          seatMap.rows[rowKey].push({
            id: row * 100 + col, // 生成一个虚拟ID
            seatNumber: seatNumber,
            status: status,
            price: price,
            type: type,
            isAccessible: isAccessible
          });
        }
      }
      
      // 更新统计数据
      seatMap.stats.availableSeats = availableSeats;
      seatMap.stats.bookedSeats = bookedSeats;
      seatMap.stats.lockedSeats = lockedSeats;
      seatMap.stats.unavailableSeats = unavailableSeats;
      
      console.log(`Generated seat map with ${Object.keys(seatMap.rows).length} rows, ${colCount} columns`);
      console.log(`Stats: Available: ${availableSeats}, Booked: ${bookedSeats}, Locked: ${lockedSeats}, Unavailable: ${unavailableSeats}`);

      return res.status(200).json({
        success: true,
        message: 'Seat information retrieved successfully',
        data: seatMap
      });
    } catch (err: unknown) {
      console.error('Error fetching seat information:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve seat information',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * 临时锁定座位
   * 使用Redis TTL机制实现座位的临时锁定
   */
  async lockSeats(req: Request, res: Response) {
    try {
      // 检查用户是否已认证
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'User must be logged in to lock seats'
        });
      }

      const { eventId } = req.params;
      const { seats } = req.body;
      
      if (!Array.isArray(seats) || seats.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid seats data. Expected an array of seats.'
        });
      }
      
      // 检查事件是否存在
      const event = await eventRepo.findOne({
        where: { id: eventId }
      });
      
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }
      
      // 生成锁定会话ID
      const lockSessionId = uuidv4();
      const lockedSeats = [];
      const failedSeats = [];
      
      // 处理每个座位
      for (const seat of seats) {
        const { row, seatNumber } = seat;
        
        if (!row || !seatNumber) {
          failedSeats.push({ row, seatNumber, reason: 'Invalid seat data' });
          continue;
        }
        
        // 检查座位是否存在
        const seatEntity = await seatRepo.findOne({
          where: { 
            event: { id: eventId },
            row,
            seatNumber
          }
        });
        
        // 如果座位不存在于事件中，检查它是否存在于场馆中
        if (!seatEntity) {
          const venueSeat = await seatRepo.findOne({
            where: {
              venue: { id: event.venue?.id },
              row,
              seatNumber
            }
          });
          
          if (!venueSeat) {
            failedSeats.push({ row, seatNumber, reason: 'Seat not found' });
            continue;
          }
        }
        
        // 检查座位是否已经被锁定或预订
        if (seatEntity && (seatEntity.status === SeatStatus.LOCKED || seatEntity.status === SeatStatus.BOOKED)) {
          failedSeats.push({ row, seatNumber, reason: `Seat is already ${seatEntity.status.toLowerCase()}` });
          continue;
        }
        
        // 检查Redis中是否已经锁定
        const redisKey = `${SEAT_LOCK_PREFIX}${eventId}:${row}:${seatNumber}`;
        const existingLock = await redis.get(redisKey);
        
        if (existingLock) {
          failedSeats.push({ row, seatNumber, reason: 'Seat is temporarily locked by another user' });
          continue;
        }
        
        // 在Redis中锁定座位
        await redis.set(
          redisKey,
          JSON.stringify({ 
            eventId, 
            row, 
            seatNumber, 
            lockSessionId,
            userId, // 添加用户ID到锁定信息中
            timestamp: new Date().toISOString()
          }),
          'EX',
          SEAT_LOCK_TTL
        );
        
        lockedSeats.push({ row, seatNumber });
      }
      
      // 返回结果
      return res.status(200).json({
        success: true,
        message: `Successfully locked ${lockedSeats.length} seats`,
        data: {
          lockSessionId,
          ttl: SEAT_LOCK_TTL,
          lockedSeats,
          failedSeats,
          expiresAt: new Date(Date.now() + SEAT_LOCK_TTL * 1000).toISOString()
        }
      });
    } catch (err: unknown) {
      console.error('Error locking seats:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to lock seats',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * 释放临时锁定的座位
   */
  async unlockSeats(req: Request, res: Response) {
    try {
      // 检查用户是否已认证
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'User must be logged in to unlock seats'
        });
      }

      const { eventId } = req.params;
      const { lockSessionId, seats } = req.body;
      
      if (!lockSessionId) {
        return res.status(400).json({
          success: false,
          message: 'Lock session ID is required'
        });
      }
      
      if (!Array.isArray(seats) || seats.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid seats data. Expected an array of seats.'
        });
      }
      
      const unlockedSeats = [];
      const failedSeats = [];
      
      // 处理每个座位
      for (const seat of seats) {
        const { row, seatNumber } = seat;
        
        if (!row || !seatNumber) {
          failedSeats.push({ row, seatNumber, reason: 'Invalid seat data' });
          continue;
        }
        
        // 检查Redis中的锁
        const redisKey = `${SEAT_LOCK_PREFIX}${eventId}:${row}:${seatNumber}`;
        const existingLock = await redis.get(redisKey);
        
        if (!existingLock) {
          failedSeats.push({ row, seatNumber, reason: 'Seat is not locked' });
          continue;
        }
        
        // 验证锁定会话ID
        const lockData = JSON.parse(existingLock);
        if (lockData.lockSessionId !== lockSessionId) {
          failedSeats.push({ row, seatNumber, reason: 'Seat is locked by a different session' });
          continue;
        }
        
        // 验证用户ID（如果锁中包含用户ID）
        if (lockData.userId && lockData.userId !== userId) {
          // 如果锁是由其他用户创建的，只有管理员才能解锁
          // 这里可以添加管理员检查逻辑
          failedSeats.push({ row, seatNumber, reason: 'Seat is locked by another user' });
          continue;
        }
        
        // 释放锁
        await redis.del(redisKey);
        unlockedSeats.push({ row, seatNumber });
      }
      
      // 返回结果
      return res.status(200).json({
        success: true,
        message: `Successfully unlocked ${unlockedSeats.length} seats`,
        data: {
          unlockedSeats,
          failedSeats
        }
      });
    } catch (err: unknown) {
      console.error('Error unlocking seats:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to unlock seats',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * 获取座位锁定的剩余时间
   */
  async getLockRemainingTime(req: Request, res: Response) {
    try {
      const { eventId } = req.params;
      const { lockSessionId } = req.query;
      
      if (!lockSessionId) {
        return res.status(400).json({
          success: false,
          message: 'Lock session ID is required'
        });
      }
      
      // 检查事件是否存在
      const event = await eventRepo.findOne({
        where: { id: eventId }
      });
      
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }
      
      // 获取与此锁定会话相关的所有键
      const lockedSeatsKeys = await redis.keys(`${SEAT_LOCK_PREFIX}${eventId}:*`);
      
      if (lockedSeatsKeys.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No locked seats found for this session'
        });
      }
      
      // 检查第一个键的TTL（所有键应该有相同的过期时间）
      const ttl = await redis.ttl(lockedSeatsKeys[0]);
      
      // 如果TTL小于0，表示键不存在或没有设置过期时间
      if (ttl < 0) {
        return res.status(404).json({
          success: false,
          message: 'Lock has expired or does not exist'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Lock remaining time retrieved successfully',
        data: {
          remainingTime: ttl,
          totalTime: SEAT_LOCK_TTL,
          expiresAt: new Date(Date.now() + ttl * 1000).toISOString()
        }
      });
    } catch (err: unknown) {
      console.error('Error getting lock remaining time:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to get lock remaining time',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  }
};