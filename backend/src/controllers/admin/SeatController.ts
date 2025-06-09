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
      
      const availableSeats = await seatRepository.find({
        where: whereCondition,
        relations: ['venue', 'event']
      });

      return res.status(200).json({
        success: true,
        message: 'Available seats retrieved successfully',
        data: availableSeats
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
      
      const seatRepository = AppDataSource.getRepository(Seat);
      
      // Find all seats locked by this user
      const lockedSeats = await seatRepository.find({
        where: {
          status: SeatStatus.LOCKED,
          lockBy: userId
        }
      });
      
      if (lockedSeats.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No locked seats found for this user',
          data: { releasedCount: 0 }
        });
      }
      
      // Release each lock
      for (const seat of lockedSeats) {
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
        message: `Released ${lockedSeats.length} seat locks for user`,
        data: {
          releasedCount: lockedSeats.length,
          seats: lockedSeats.map(s => s.id)
        }
      });
    } catch (err: unknown) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: 'Failed to release user locks',
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
  }
}; 