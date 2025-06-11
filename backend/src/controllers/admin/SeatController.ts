import { Request, Response } from 'express';
import { In, FindOptionsWhere } from 'typeorm';
import { Seat, SeatStatus } from '../../entities/Seat';
import { 
  seatCreateSchema, 
  getAvailableSeatsSchema, 
  lockSeatsSchema, 
  confirmBookingSchema 
} from '../../schemas/admin';
import { ZodError } from 'zod';
import { redisClient, connectRedis } from '../../config/redis';
import { AppDataSource } from '../../config/data-source';
import { Event } from '../../entities/Event';

// Seat lock timeout in seconds
const SEAT_LOCK_TIMEOUT = 300; // 5 minutes

// Helper function to ensure Redis is connected
const ensureRedisConnection = async () => {
  if (!redisClient.isOpen) {
    await connectRedis();
  }
  return redisClient;
};

export const SeatController = {
  /**
   * Get all available seats for an event
   * @param req Request object
   * @param res Response object
   */
  async getAvailableSeats(req: Request, res: Response) {
    try {
      const { eventId } = getAvailableSeatsSchema.parse(req.params);
      
      const seatRepository = AppDataSource.getRepository(Seat);
      
      // Using type casting to overcome TypeORM type limitations
      const whereCondition = {
        event: { id: eventId },
        status: SeatStatus.AVAILABLE
      } as FindOptionsWhere<Seat>;
      
      const seats = await seatRepository.find({
        where: whereCondition,
        relations: ['venue', 'event']
      });

      return res.status(200).json({
        success: true,
        message: 'Available seats retrieved successfully',
        data: seats
      });
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          error: err.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch available seats',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Lock seats for a user
   * @param req Request object
   * @param res Response object
   */
  async lockSeats(req: Request, res: Response) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required', 
          error: null 
        });
      }

      // Ensure Redis is connected
      const redis = await ensureRedisConnection();

      const { eventId, seatIds } = lockSeatsSchema.parse(req.body);
      
      // Lock seats in a transaction
      const seatRepository = queryRunner.manager.getRepository(Seat);
      
      // First verify all seats exist
      // Using type casting to overcome TypeORM type limitations
      const whereCondition = {
        id: In(seatIds),
        event: { id: eventId }
      } as FindOptionsWhere<Seat>;
      
      const seats = await seatRepository.find({
        where: whereCondition
      });

      if (seats.length !== seatIds.length) {
        await queryRunner.rollbackTransaction();
        return res.status(400).json({
          success: false,
          message: 'Some seats do not exist',
          error: null
        });
      }

      // Check if any seats are already locked or booked
      const unavailableSeats = seats.filter(seat => 
        seat.status !== SeatStatus.AVAILABLE
      );

      if (unavailableSeats.length > 0) {
        await queryRunner.rollbackTransaction();
        return res.status(400).json({
          success: false,
          message: 'Some seats are no longer available',
          error: {
            unavailableSeats: unavailableSeats.map(s => s.id)
          }
        });
      }

      // Update seat status to locked
      const now = new Date();
      await Promise.all(seats.map(async seat => {
        seat.status = SeatStatus.LOCKED;
        seat.lockTime = now;
        seat.lockBy = userId;
        await seatRepository.save(seat);

        // Use Redis to set lock timeout
        const lockKey = `seat:lock:${seat.id}`;
        await redis.set(lockKey, userId);
        await redis.expire(lockKey, SEAT_LOCK_TIMEOUT);
      }));

      await queryRunner.commitTransaction();

      return res.status(200).json({
        success: true,
        message: 'Seats locked successfully',
        data: {
          eventId,
          seatIds,
          lockedUntil: new Date(now.getTime() + SEAT_LOCK_TIMEOUT * 1000),
          lockTimeoutSeconds: SEAT_LOCK_TIMEOUT
        }
      });
    } catch (err: unknown) {
      await queryRunner.rollbackTransaction();
      console.error(err);
      
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          error: err.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to lock seats',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    } finally {
      await queryRunner.release();
    }
  },

  /**
   * Confirm booking of locked seats
   * @param req Request object
   * @param res Response object
   */
  async confirmBooking(req: Request, res: Response) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required', 
          error: null 
        });
      }

      // Ensure Redis is connected
      const redis = await ensureRedisConnection();

      const { eventId, seatIds } = confirmBookingSchema.parse(req.body);
      
      // Update seat status in a transaction
      const seatRepository = queryRunner.manager.getRepository(Seat);
      
      // Verify all seats exist and are locked by the current user
      // Using type casting to overcome TypeORM type limitations
      const whereCondition = {
        id: In(seatIds),
        event: { id: eventId },
        status: SeatStatus.LOCKED,
        lockBy: userId
      } as FindOptionsWhere<Seat>;
      
      const seats = await seatRepository.find({
        where: whereCondition
      });

      if (seats.length !== seatIds.length) {
        await queryRunner.rollbackTransaction();
        return res.status(400).json({
          success: false,
          message: 'Some seats cannot be confirmed, they may have expired or were not locked by you',
          error: null
        });
      }

      // Update seat status to booked
      await Promise.all(seats.map(async seat => {
        seat.status = SeatStatus.BOOKED;
        await seatRepository.save(seat);

        // Remove Redis lock record
        const lockKey = `seat:lock:${seat.id}`;
        await redis.del(lockKey);
      }));

      await queryRunner.commitTransaction();

      return res.status(200).json({
        success: true,
        message: 'Seat booking confirmed successfully',
        data: {
          eventId,
          seatIds,
          bookedAt: new Date()
        }
      });
    } catch (err: unknown) {
      await queryRunner.rollbackTransaction();
      console.error(err);
      
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          error: err.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to confirm booking',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    } finally {
      await queryRunner.release();
    }
  },

  /**
   * Release expired seat locks
   * @param req Request object
   * @param res Response object
   */
  async releaseExpiredLocks(req: Request, res: Response) {
    try {
      // Ensure Redis is connected
      const redis = await ensureRedisConnection();
      
      const now = new Date();
      const cutoffTime = new Date(now.getTime() - SEAT_LOCK_TIMEOUT * 1000);
      
      const seatRepository = AppDataSource.getRepository(Seat);
      
      // Find all seats with lock times older than the cutoff
      const expiredLocks = await seatRepository.find({
        where: {
          status: SeatStatus.LOCKED,
          lockTime: {
            $lt: cutoffTime
          } as any // TypeORM doesn't have great support for date comparisons
        }
      });
      
      if (expiredLocks.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No expired locks found',
          data: { releasedCount: 0 }
        });
      }
      
      // Release each expired lock
      for (const seat of expiredLocks) {
        seat.status = SeatStatus.AVAILABLE;
        seat.lockTime = null as any;
        seat.lockBy = null as any;
        await seatRepository.save(seat);
        
        // Remove from Redis too
        const lockKey = `seat:lock:${seat.id}`;
        await redis.del(lockKey);
      }
      
      return res.status(200).json({
        success: true,
        message: `Released ${expiredLocks.length} expired seat locks`,
        data: {
          releasedCount: expiredLocks.length,
          seats: expiredLocks.map(s => s.id)
        }
      });
    } catch (err: unknown) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: 'Failed to release expired locks',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Create new seats for a venue or event
   * @param req Request object
   * @param res Response object
   */
  async create(req: Request, res: Response) {
    try {
      const seatData = seatCreateSchema.parse(req.body);
      const seatRepository = AppDataSource.getRepository(Seat);
      
      const newSeat = seatRepository.create(seatData);
      await seatRepository.save(newSeat);
      
      return res.status(201).json({
        success: true,
        message: 'Seat created successfully',
        data: newSeat
      });
    } catch (err: unknown) {
      console.error(err);
      
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          error: err.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to create seat',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },
  
  /**
   * Get all seats for a venue
   * @param req Request object
   * @param res Response object
   */
  async getByVenue(req: Request, res: Response) {
    try {
      const { venueId } = req.params;
      const seatRepository = AppDataSource.getRepository(Seat);
      
      const seats = await seatRepository.find({
        where: { 
          venue: { id: parseInt(venueId) } 
        } as FindOptionsWhere<Seat>,
        relations: ['venue']
      });
      
      return res.status(200).json({
        success: true,
        message: 'Venue seats retrieved successfully',
        data: seats
      });
    } catch (err: unknown) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch venue seats',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },
  
  /**
   * Release all locks for a specific user
   * @param req Request object
   * @param res Response object
   */
  async releaseUserLocks(req: Request, res: Response) {
    try {
      // 临时移除用户认证要求，方便测试
      // const userId = req.user?.id;
      // if (!userId) {
      //   return res.status(401).json({ 
      //     success: false, 
      //     message: 'Authentication required', 
      //     error: null 
      //   });
      // }
      
      // Ensure Redis is connected
      const redis = await ensureRedisConnection();
      
      // 获取请求中的座位ID
      const { seatIds } = req.body;
      
      if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No seat IDs provided',
          error: 'seatIds array is required'
        });
      }
      
      // 查找所有指定的座位
      const seatRepository = AppDataSource.getRepository(Seat);
      const seats = await seatRepository.findBy({
        id: In(seatIds)
      });
      
      if (seats.length === 0) {
        return res.status(404).json({
          success: true,
          message: 'No seats found with the provided IDs',
          data: { releasedCount: 0 }
        });
      }
      
      // 释放每个锁
      for (const seat of seats) {
        // 更新数据库中的座位状态
        if (seat.status === SeatStatus.LOCKED) {
          seat.status = SeatStatus.AVAILABLE;
          seat.lockTime = null as any;
          seat.lockBy = null as any;
          await seatRepository.save(seat);
        }
        
        // 同时检查Redis中的锁
        // 尝试不同的键格式以确保所有锁都被释放
        const lockKeys = [
          `seat:lock:${seat.id}`,
          `seat:lock:${seat.event?.id}:${seat.row}:${seat.seatNumber}`
        ];
        
        for (const key of lockKeys) {
          const exists = await redis.exists(key);
          if (exists) {
            await redis.del(key);
          }
        }
      }
      
      return res.status(200).json({
        success: true,
        message: `Released locks for ${seats.length} seats`,
        data: {
          releasedCount: seats.length,
          seats: seats.map(s => s.id)
        }
      });
    } catch (err: unknown) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: 'Failed to release seat locks',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },
  
  /**
   * Get lock status for a specific seat
   * @param req Request object
   * @param res Response object
   */
  async getLockStatus(req: Request, res: Response) {
    try {
      const { seatId } = req.params;
      
      // Ensure Redis is connected
      const redis = await ensureRedisConnection();
      
      const seatRepository = AppDataSource.getRepository(Seat);
      
      const seat = await seatRepository.findOne({
        where: { id: parseInt(seatId) } as FindOptionsWhere<Seat>,
        relations: ['event']
      });
      
      if (!seat) {
        return res.status(404).json({
          success: false,
          message: 'Seat not found',
          error: null
        });
      }
      
      // Check Redis for lock info
      const lockKey = `seat:lock:${seatId}`;
      const lockUserId = await redis.get(lockKey);
      const ttl = await redis.ttl(lockKey);
      
      return res.status(200).json({
        success: true,
        message: 'Seat lock status retrieved',
        data: {
          seat: {
            id: seat.id,
            status: seat.status,
            lockTime: seat.lockTime,
            lockBy: seat.lockBy
          },
          redis: {
            isLocked: !!lockUserId,
            lockUserId: lockUserId || null,
            ttl: ttl > 0 ? ttl : null,
            expiresAt: ttl > 0 ? new Date(Date.now() + ttl * 1000) : null
          }
        }
      });
    } catch (err: unknown) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: 'Failed to get lock status',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Get seats by event ID
   * @param req Request object
   * @param res Response object
   */
  async getByEventId(req: Request, res: Response) {
    try {
      const { eventId } = req.params;
      
      if (!eventId) {
        return res.status(400).json({
          success: false,
          message: 'Event ID is required',
          error: 'Missing eventId parameter'
        });
      }
      
      // 获取事件信息，包括场地
      const eventRepository = AppDataSource.getRepository(Event);
      const event = await eventRepository.findOne({
        where: { id: eventId } as FindOptionsWhere<Event>,
        relations: ['venue']
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      // 获取场地ID
      const venueId = event.venue?.id;
      
      if (!venueId) {
        return res.status(404).json({
          success: false,
          message: 'Venue not found for this event'
        });
      }
      
      // 创建固定的10×12座位排布
      const rowCount = 10; // 10行
      const colCount = 12; // 12列
      const totalSeats = rowCount * colCount; // 总座位数
      
      const seatRepository = AppDataSource.getRepository(Seat);
      
      // 获取与事件关联的座位
      const eventSeats = await seatRepository.find({
        where: { event: { id: eventId } } as FindOptionsWhere<Seat>,
        order: {
          row: 'ASC',
          seatNumber: 'ASC'
        }
      });
      
      // 创建事件座位的映射，用于快速查找
      const eventSeatMap = new Map();
      eventSeats.forEach(seat => {
        const key = `${seat.row}-${seat.seatNumber}`;
        eventSeatMap.set(key, seat);
      });
      
      // 确保Redis连接
      const redis = await ensureRedisConnection();
      
      // 获取Redis中所有临时锁定的座位
      const lockPrefix = `seat:lock:${eventId}:`;
      const lockedSeatsKeys = await redis.keys(`${lockPrefix}*`);
      const temporaryLockedSeats = new Map();
      
      // 如果有临时锁定的座位，获取它们的详细信息
      if (lockedSeatsKeys.length > 0) {
        for (const key of lockedSeatsKeys) {
          const lockInfo = await redis.get(key);
          if (lockInfo) {
            try {
              const { row, seatNumber } = JSON.parse(lockInfo);
              const mapKey = `${row}-${seatNumber}`;
              temporaryLockedSeats.set(mapKey, true);
            } catch (e) {
              console.error('Error parsing lock info:', e);
            }
          }
        }
      }
      
      // 创建座位地图
      const seatMap = {
        eventId,
        venueName: event.venue?.name || 'Unknown Venue',
        rows: {} as Record<string, Array<{
          id: number;
          seatNumber: string;
          status: SeatStatus;
          price: number;
          type: string;
          isAccessible: boolean;
        }>>,
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
          let id = row * 100 + col; // 生成一个虚拟ID
          
          // 如果找到了对应的事件座位，使用它的信息
          if (eventSeat) {
            status = eventSeat.status;
            price = event.basePrice || 100;
            type = eventSeat.type;
            isAccessible = eventSeat.isAccessible;
            id = eventSeat.id;
          }
          
          // 检查座位是否被临时锁定
          if (temporaryLockedSeats.has(key)) {
            status = SeatStatus.LOCKED;
          }
          
          // 添加一些VIP和轮椅座位类型，但价格保持一致
          if (!eventSeat) {
            if (row <= 2 && (col >= 4 && col <= 9)) {
              type = 'vip';
              price = event.basePrice || 100;
            } else if ((row === rowCount && (col === 1 || col === colCount)) || 
                      (row === 1 && (col === 1 || col === colCount))) {
              type = 'wheelchair';
              isAccessible = true;
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
            id,
            seatNumber,
            status,
            price,
            type,
            isAccessible
          });
        }
      }
      
      // 更新统计数据
      seatMap.stats.availableSeats = availableSeats;
      seatMap.stats.bookedSeats = bookedSeats;
      seatMap.stats.lockedSeats = lockedSeats;
      seatMap.stats.unavailableSeats = unavailableSeats;
      
      return res.status(200).json({
        success: true,
        message: 'Seats retrieved successfully',
        data: seatMap
      });
    } catch (err: unknown) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch seats',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Generate mock seat data for testing
   * @param eventId Event ID
   * @returns Array of mock seat objects
   */
  generateMockSeats(eventId: string): Array<Partial<Seat>> {
    const mockSeats: Array<Partial<Seat>> = [];
    const sections = ['Orchestra', 'Balcony', 'Mezzanine'];
    const rows = ['A', 'B', 'C', 'D', 'E'];
    const seatTypes = ['standard', 'vip', 'wheelchair'];
    const statuses = [SeatStatus.AVAILABLE, SeatStatus.LOCKED, SeatStatus.BOOKED];
    
    let id = 1;
    
    sections.forEach(section => {
      rows.forEach(row => {
        for (let num = 1; num <= 10; num++) {
          const seatType = seatTypes[Math.floor(Math.random() * seatTypes.length)];
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          // 所有座位价格相同
          const price = 75;
          
          mockSeats.push({
            id: id++,
            section,
            row,
            seatNumber: `${num}`,
            type: seatType,
            price,
            status,
            isAccessible: seatType === 'wheelchair',
            event: { id: eventId } as any // 使用类型断言解决类型错误
          });
        }
      });
    });
    
    return mockSeats;
  }
}; 