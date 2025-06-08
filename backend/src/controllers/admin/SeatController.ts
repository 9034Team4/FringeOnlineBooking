import { Request, Response } from 'express';
import { getRepository, getManager, In, FindOptionsWhere } from 'typeorm';
import { Seat, SeatStatus } from '../../entities/Seat';
import { 
  seatCreateSchema, 
  getAvailableSeatsSchema, 
  lockSeatsSchema, 
  confirmBookingSchema 
} from '../../schemas/admin';
import { ZodError } from 'zod';
import { redisClient, connectRedis } from '../../config/redis';

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
      
      const seatRepository = getRepository(Seat);
      
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
    const queryRunner = getManager().connection.createQueryRunner();
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
    const queryRunner = getManager().connection.createQueryRunner();
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
   * Release expired locked seats
   * @param req Request object
   * @param res Response object
   */
  async releaseExpiredLocks(req: Request, res: Response) {
    try {
      // Ensure Redis is connected
      const redis = await ensureRedisConnection();

      // Get all seats with LOCKED status
      const seatRepository = getRepository(Seat);
      // Using type casting to overcome TypeORM type limitations
      const whereCondition = {
        status: SeatStatus.LOCKED
      } as FindOptionsWhere<Seat>;
      
      const lockedSeats = await seatRepository.find({
        where: whereCondition
      });

      const now = new Date();
      const releasedSeatIds: number[] = [];

      // Check each seat for expiration
      await Promise.all(lockedSeats.map(async seat => {
        // Check lock existence in Redis, if not exists then consider expired
        const lockKey = `seat:lock:${seat.id}`;
        const exists = await redis.exists(lockKey);
        
        if (!exists) {
          seat.status = SeatStatus.AVAILABLE;
          seat.lockTime = null as any;
          seat.lockBy = null as any;
          await seatRepository.save(seat);
          releasedSeatIds.push(seat.id);
        }
      }));

      return res.status(200).json({
        success: true,
        message: 'Expired seat locks released',
        data: {
          releasedSeats: releasedSeatIds,
          count: releasedSeatIds.length
        }
      });
    } catch (err: unknown) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: 'Failed to release expired seat locks',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Create a new seat
   * @param req Request object
   * @param res Response object
   */
  async create(req: Request, res: Response) {
    try {
      // Verify admin authentication
      // TODO: Ensure admin is authenticated

      const validatedData = seatCreateSchema.parse(req.body);
      const seatRepository = getRepository(Seat);
      
      const newSeat = seatRepository.create({
        ...validatedData,
        status: SeatStatus.AVAILABLE
      });
      
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
      
      const seatRepository = getRepository(Seat);
      // Using type casting to overcome TypeORM type limitations
      const whereCondition = {
        venue: { id: parseInt(venueId) }
      } as FindOptionsWhere<Seat>;
      
      const seats = await seatRepository.find({
        where: whereCondition,
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
   * User releases their own locked seats
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

      const { eventId, seatIds } = req.body;
      
      if (!eventId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request data. eventId and seatIds array are required',
          error: null
        });
      }
      
      const seatRepository = getRepository(Seat);
      
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

      if (seats.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No matching locked seats found for this user',
          error: null
        });
      }

      // Release seats
      const releasedSeatIds: number[] = [];
      await Promise.all(seats.map(async seat => {
        seat.status = SeatStatus.AVAILABLE;
        seat.lockTime = null as any;
        seat.lockBy = null as any;
        await seatRepository.save(seat);
        
        // Remove Redis lock
        const lockKey = `seat:lock:${seat.id}`;
        await redis.del(lockKey);
        
        releasedSeatIds.push(seat.id);
      }));

      return res.status(200).json({
        success: true,
        message: 'User locked seats released successfully',
        data: {
          eventId,
          releasedSeatIds
        }
      });
    } catch (err: unknown) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: 'Failed to release seats',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Get seat lock status
   * @param req Request object
   * @param res Response object
   */
  async getLockStatus(req: Request, res: Response) {
    try {
      const { eventId, seatIds } = req.query;
      
      if (!eventId || !seatIds) {
        return res.status(400).json({
          success: false,
          message: 'Missing eventId or seatIds',
          error: null
        });
      }

      // Convert comma-separated string to array if needed
      const seatIdArray = Array.isArray(seatIds) 
        ? seatIds.map(id => Number(id)) 
        : seatIds.toString().split(',').map(id => Number(id));

      // Ensure Redis is connected
      const redis = await ensureRedisConnection();
      
      const seatRepository = getRepository(Seat);
      
      // Using type casting to overcome TypeORM type limitations
      const whereCondition = {
        id: In(seatIdArray),
        event: { id: eventId.toString() }
      } as FindOptionsWhere<Seat>;
      
      const seats = await seatRepository.find({
        where: whereCondition
      });

      // Check status of each seat and remaining lock time
      const seatStatuses = await Promise.all(seats.map(async seat => {
        const lockKey = `seat:lock:${seat.id}`;
        const ttl = await redis.ttl(lockKey);
        const isLocked = ttl > 0;
        
        return {
          id: seat.id,
          status: seat.status,
          isLocked,
          remainingLockTime: isLocked ? ttl : 0,
          lockBy: seat.lockBy
        };
      }));

      return res.status(200).json({
        success: true,
        message: 'Seat lock status retrieved successfully',
        data: seatStatuses
      });
    } catch (err: unknown) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: 'Failed to get seat lock status',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  }
}; 