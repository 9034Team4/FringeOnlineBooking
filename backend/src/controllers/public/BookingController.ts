import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { bookingCreateSchema, bookingCancelSchema, bookingQuerySchema } from '../../schemas/booking';
import { AppDataSource } from '../../config/data-source';
import { Booking, BookingStatus } from '../../entities/Booking';
import { Event } from '../../entities/Event';
import { Seat, SeatStatus } from '../../entities/Seat';
import { User } from '../../entities/User';
import { Ticket, TicketStatus } from '../../entities/Ticket';
import { Payment } from '../../entities/Payment';
import Redis from 'ioredis';

const bookingRepo = AppDataSource.getRepository(Booking);
const eventRepo = AppDataSource.getRepository(Event);
const seatRepo = AppDataSource.getRepository(Seat);

// 初始化Redis客户端
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

// Redis键前缀
const SEAT_LOCK_PREFIX = 'seat:lock:';

export const BookingController = {
  /**
   * Get seat map for an event
   */
  async getSeatMap(req: Request, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // TODO: DB integration - Fetch seat map
      // This should include:
      // - All seats for the event's venue
      // - Current booking status of each seat
      // - Pricing information
      const mockSeatMap = {
        eventId,
        venue: {
          id: 'venue-1',
          name: 'Main Hall',
          sections: [
            {
              id: 'section-a',
              name: 'Section A',
              seats: [
                { id: 'seat-1', number: 'A1', status: 'available', price: 50 },
                { id: 'seat-2', number: 'A2', status: 'booked', price: 50 }
              ]
            }
          ]
        }
      };

      res.status(200).json({
        success: true,
        message: 'Seat map retrieved successfully',
        data: mockSeatMap
      });
    } catch (err: unknown) {
      console.error('Error fetching seat map:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch seat map',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Book tickets for an event
   */
  async bookTicket(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const validatedData = bookingCreateSchema.parse(req.body);
      const { eventId, seatIds, ticketType, quantity } = validatedData;

      // TODO: DB integration - Check seat availability
      // This should:
      // 1. Verify event exists and is active
      // 2. Check if seats are available
      // 3. Create booking with seats
      // 4. Update seat status
      // 5. Create associated tickets
      const mockBooking = {
        id: 'booking-1',
        eventId,
        userId,
        status: BookingStatus.PENDING,
        seats: seatIds.map(id => ({ id, status: 'reserved' })),
        tickets: Array(quantity).fill(null).map((_, i) => ({
          id: `ticket-${i + 1}`,
          type: ticketType,
          status: 'pending'
        })),
        totalAmount: 50 * quantity,
        createdAt: new Date().toISOString()
      };

      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: mockBooking
      });
    } catch (err: unknown) {
      console.error('Error creating booking:', err);
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid input data',
          error: err.message
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: 'Failed to create booking',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Get booking details by ID
   */
  async getBookingDetails(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // 从数据库获取预订详情
      const booking = await bookingRepo.findOne({
        where: { 
          id, 
          user: { id: userId } 
        },
        relations: ['event', 'event.venue', 'user', 'tickets']
      });

      if (!booking) {
        res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
        return;
      }

      // 获取票据关联的座位信息
      const ticketsWithSeats = await Promise.all(
        booking.tickets.map(async (ticket) => {
          let seatInfo = "未分配座位";
          if (ticket.seatNumber) {
            // 如果票据有座位号，可以构建一个简单的座位信息
            seatInfo = `${ticket.section || ''} ${ticket.seatNumber}`;
          }
          
          return {
            id: ticket.id,
            type: ticket.type,
            status: ticket.status,
            seatInfo: seatInfo,
            ticketNumber: ticket.id.substring(0, 8) // 使用ID的前8位作为票号
          };
        })
      );

      // 处理返回的数据
      const responseData = {
        id: booking.id,
        event: {
          id: booking.event.id,
          title: booking.event.name,
          date: booking.event.startTime,
          venue: booking.event.venue.name
        },
        status: booking.status,
        tickets: ticketsWithSeats,
        totalAmount: booking.totalAmount,
        createdAt: booking.createdAt,
        userId: booking.user.id,
        userName: `${booking.user.firstName} ${booking.user.lastName}`
      };

      res.status(200).json({
        success: true,
        message: 'Booking details retrieved successfully',
        data: responseData
      });
    } catch (err: unknown) {
      console.error('Error fetching booking details:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch booking details',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Cancel a booking
   */
  async cancelBooking(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const validatedData = bookingCancelSchema.parse(req.body);
      const { reason } = validatedData;

      // TODO: DB integration - Cancel booking
      // This should:
      // 1. Verify booking exists and belongs to user
      // 2. Check if cancellation is allowed (time window, status)
      // 3. Update booking status
      // 4. Release seats
      // 5. Cancel associated tickets
      // 6. Initiate refund if applicable
      const mockCancelledBooking = {
        id,
        status: BookingStatus.CANCELLED,
        cancellationReason: reason,
        cancelledAt: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully',
        data: mockCancelledBooking
      });
    } catch (err: unknown) {
      console.error('Error cancelling booking:', err);
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid input data',
          error: err.message
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: 'Failed to cancel booking',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Get all bookings for the current user
   */
  async getUserBookings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const validatedQuery = bookingQuerySchema.parse(req.query);
      const { page, limit, status, startDate, endDate } = validatedQuery;

      // TODO: DB integration - Fetch user bookings
      // This should:
      // 1. Get paginated bookings for user
      // 2. Apply filters (status, date range)
      // 3. Include basic event and ticket info
      const mockBookings = {
        items: [
          {
            id: 'booking-1',
            event: {
              id: 'event-1',
              title: 'Sample Event',
              date: new Date().toISOString()
            },
            status: BookingStatus.CONFIRMED,
            ticketCount: 2,
            totalAmount: 100,
            createdAt: new Date().toISOString()
          }
        ],
        pagination: {
          page,
          limit,
          total: 1,
          totalPages: 1
        }
      };

      res.status(200).json({
        success: true,
        message: 'User bookings retrieved successfully',
        data: mockBookings
      });
    } catch (err: unknown) {
      console.error('Error fetching user bookings:', err);
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          error: err.message
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user bookings',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Get all bookings for the current logged-in user (new endpoint)
   */
  async getMyBookings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required', error: null });
        return;
      }
      // TODO: Fetch all bookings for the user from the database
      const mockBookings = [
        { id: 'booking-1', event: 'Sample Event', status: 'CONFIRMED', createdAt: new Date().toISOString() }
      ];
      res.status(200).json({
        success: true,
        message: 'User bookings retrieved successfully',
        data: mockBookings
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch user bookings', error: err.message });
    }
  },

  /**
   * Export the specified booking details and ticket info as a downloadable PDF or CSV (new endpoint)
   */
  async exportBooking(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required', error: null });
        return;
      }
      const { id } = req.params;
      // TODO: Fetch booking, validate ownership, generate PDF/CSV
      // For now, return a mock download link
      const mockExportLink = `https://example.com/downloads/booking-${id}.pdf`;
      res.status(200).json({
        success: true,
        message: 'Booking export generated',
        data: { downloadUrl: mockExportLink }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to export booking', error: err.message });
    }
  },

  /**
   * Cancel a booking by ID (new endpoint)
   */
  async cancelBookingById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required', error: null });
        return;
      }
      const { id } = req.params;
      // TODO: Validate booking ownership and cancel booking in DB
      res.status(200).json({
        success: true,
        message: `Booking ${id} cancelled successfully`,
        data: { bookingId: id, status: 'CANCELLED' }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to cancel booking', error: err.message });
    }
  },

  /**
   * Confirm a booking by ID (new endpoint)
   */
  async confirmBookingById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required', error: null });
        return;
      }
      const { id } = req.params;
      // TODO: Validate booking ownership and confirm booking in DB
      res.status(200).json({
        success: true,
        message: `Booking ${id} confirmed successfully`,
        data: { bookingId: id, status: 'CONFIRMED' }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to confirm booking', error: err.message });
    }
  },

  /**
   * Confirm booking and process payment
   */
  async confirmBooking(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Validate input data
      const { eventId, lockSessionId, seats, paymentMethod, amount, paymentDetails, customerName } = req.body;

      if (!eventId || !lockSessionId || !seats || !Array.isArray(seats) || seats.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Invalid booking data provided'
        });
        return;
      }

      // Start a transaction
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Get the event
        const event = await queryRunner.manager.findOne(Event, { 
          where: { id: eventId },
          relations: ['venue']
        });
        if (!event) {
          throw new Error('Event not found');
        }

        // Get the user
        const user = await queryRunner.manager.findOne(User, { where: { id: userId } });
        if (!user) {
          throw new Error('User not found');
        }

        // 验证座位是否被锁定
        const seatEntities = [];
        for (const seat of seats) {
          // 首先检查Redis中的锁定状态
          const redisKey = `${SEAT_LOCK_PREFIX}${eventId}:${seat.row}:${seat.seatNumber}`;
          const lockData = await redis.get(redisKey);
          
          if (!lockData) {
            throw new Error(`Seat ${seat.row}-${seat.seatNumber} is not locked or has been released`);
          }
          
          // 验证锁定会话ID
          const lockInfo = JSON.parse(lockData);
          if (lockInfo.lockSessionId !== lockSessionId) {
            throw new Error(`Seat ${seat.row}-${seat.seatNumber} is locked by a different session`);
          }
          
          // 获取座位实体
          let seatEntity = await queryRunner.manager.findOne(Seat, { 
            where: { 
              row: seat.row,
              seatNumber: seat.seatNumber,
              event: { id: eventId }
            }
          });
          
          // 如果找不到座位，可能是因为座位存在于场馆但未关联到事件
          if (!seatEntity) {
            console.log(`尝试查找场馆座位: ${seat.row}-${seat.seatNumber} 在场馆ID: ${event.venue?.id}`);
            
            // 查找场馆中的座位
            const venueSeat = await queryRunner.manager.findOne(Seat, {
              where: {
                row: seat.row,
                seatNumber: seat.seatNumber,
                venue: { id: event.venue?.id }
              }
            });
            
            if (!venueSeat) {
              console.log(`场馆座位未找到，尝试创建新座位: ${seat.row}-${seat.seatNumber}`);
              
              // 尝试查询任何关联到此场馆的座位，确认行格式
              const anyVenueSeat = await queryRunner.manager.findOne(Seat, {
                where: {
                  venue: { id: event.venue?.id }
                }
              });
              
              console.log(`场馆现有座位示例:`, anyVenueSeat ? 
                `${anyVenueSeat.row}-${anyVenueSeat.seatNumber}` : '无');
              
              // 如果在场馆中也找不到座位，创建一个新的座位
              const newVenueSeat = new Seat();
              newVenueSeat.row = seat.row;
              newVenueSeat.seatNumber = seat.seatNumber;
              newVenueSeat.section = '默认区域'; // 默认区域名称
              newVenueSeat.venue = event.venue;
              newVenueSeat.status = SeatStatus.AVAILABLE;
              newVenueSeat.price = seat.price || event.basePrice || 100;
              newVenueSeat.type = 'standard';
              newVenueSeat.isAccessible = false; // 设置默认值为不可访问
              
              // 保存新创建的场馆座位
              const savedVenueSeat = await queryRunner.manager.save(newVenueSeat);
              console.log(`已创建新的场馆座位: ${savedVenueSeat.row}-${savedVenueSeat.seatNumber}`);
              
              // 创建关联到事件的座位
              seatEntity = new Seat();
              seatEntity.row = seat.row;
              seatEntity.seatNumber = seat.seatNumber;
              seatEntity.section = savedVenueSeat.section;
              seatEntity.price = seat.price || savedVenueSeat.price;
              seatEntity.event = event;
              seatEntity.venue = event.venue;
              seatEntity.status = SeatStatus.AVAILABLE;
              seatEntity.isAccessible = false; // 设置默认值为不可访问
            } else {
              console.log(`找到场馆座位: ${venueSeat.row}-${venueSeat.seatNumber}`);
              
              // 使用现有场馆座位创建关联到事件的座位
              seatEntity = new Seat();
              seatEntity.row = venueSeat.row;
              seatEntity.seatNumber = venueSeat.seatNumber;
              seatEntity.section = venueSeat.section;
              seatEntity.price = seat.price || venueSeat.price;
              seatEntity.event = event;
              seatEntity.venue = venueSeat.venue;
              seatEntity.status = SeatStatus.AVAILABLE;
              seatEntity.isAccessible = venueSeat.isAccessible; // 从场馆座位复制可访问性设置
            }
            
            // 保存新座位
            seatEntity = await queryRunner.manager.save(seatEntity);
            console.log(`已创建并关联事件座位: ${seatEntity.row}-${seatEntity.seatNumber}`);
          } else {
            console.log(`找到事件关联座位: ${seatEntity.row}-${seatEntity.seatNumber}`);
          }
          
          seatEntities.push(seatEntity);
        }

        // Create a new booking
        const booking = new Booking();
        booking.event = event;
        booking.user = user;
        booking.status = BookingStatus.CONFIRMED;
        booking.totalAmount = parseFloat(amount);
        booking.paymentStatus = 'PAID';
        
        // Save the booking to get an ID
        const savedBooking = await queryRunner.manager.save(booking);

        // 构建客户姓名
        const ticketCustomerName = customerName || `${user.firstName} ${user.lastName}`.trim();
        
        // 获取事件图片，如果没有则使用默认图片
        const eventImage = event.imageUrl || `/assets/images/event-${parseInt(event.id.substring(0, 4), 10) % 5 || 0}.png`;

        // Create tickets for each seat
        const tickets = [];
        for (let i = 0; i < seatEntities.length; i++) {
          const seat = seatEntities[i];
          const seatData = seats[i];
          
          // Update seat status to booked
          seat.status = SeatStatus.BOOKED;
          seat.lockTime = null as any;
          seat.lockBy = null as any;
          await queryRunner.manager.save(seat);
          
          // Create ticket
          const ticket = new Ticket();
          ticket.event = event;
          ticket.user = user;
          ticket.booking = savedBooking;
          ticket.price = seatData.price;
          ticket.status = TicketStatus.VALID;
          ticket.row = seat.row;
          ticket.seatNumber = seat.seatNumber;
          ticket.section = seat.section;
          
          // 设置票号
          const ticketNumber = `${event.id.substring(0, 4)}-${savedBooking.id.substring(0, 4)}-${i+1}`;
          ticket.ticketNumber = ticketNumber;
          
          // 设置客户名称
          ticket.customerName = ticketCustomerName;
          
          // 设置事件图片
          ticket.eventImage = eventImage;
          
          // Generate QR code data
          const qrData = {
            ticketId: ticket.id,
            eventId: event.id,
            bookingId: savedBooking.id,
            seat: `${seat.row}-${seat.seatNumber}`,
            ticketNumber: ticketNumber,
            userId: user.id
          };
          ticket.qrCode = JSON.stringify(qrData);
          
          const savedTicket = await queryRunner.manager.save(ticket);
          tickets.push(savedTicket);
          
          // 从Redis中删除锁定信息
          const redisKey = `${SEAT_LOCK_PREFIX}${eventId}:${seat.row}:${seat.seatNumber}`;
          await redis.del(redisKey);
        }

        // Create payment record
        const payment = new Payment();
        payment.user = user;
        payment.method = paymentMethod;
        payment.amount = parseFloat(amount);
        payment.status = 'SUCCESS';
        payment.transactionId = `txn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        payment.timestamp = new Date();
        
        await queryRunner.manager.save(payment);

        // Commit the transaction
        await queryRunner.commitTransaction();

        // Prepare response data
        const responseData = {
          bookingId: savedBooking.id,
          eventId: event.id,
          seats: seats.map(seat => ({
            row: seat.row,
            seatNumber: seat.seatNumber
          })),
          tickets: tickets.map(ticket => ({
            ticketId: ticket.id,
            eventId: event.id,
            userId: user.id,
            customerName: ticket.customerName,
            seatInfo: `${ticket.row}-${ticket.seatNumber}`,
            ticketNumber: ticket.ticketNumber,
            price: ticket.price,
            status: ticket.status,
            eventImage: ticket.eventImage
          })),
          totalAmount: booking.totalAmount,
          paymentMethod: paymentMethod,
          status: booking.status,
          createdAt: booking.createdAt
        };

        // Return success response
        res.status(200).json({
          success: true,
          message: 'Booking confirmed successfully',
          data: responseData
        });
      } catch (error) {
        // Rollback transaction in case of error
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        // Release the query runner
        await queryRunner.release();
      }
    } catch (err: unknown) {
      console.error('Error confirming booking:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to confirm booking',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  }
};