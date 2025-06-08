import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { eventQuerySchema } from '../../schemas/event';
import { AppDataSource } from '../../config/data-source';
import { Event, EventStatus } from '../../entities/Event';
import { Seat, SeatStatus } from '../../entities/Seat';

const eventRepo = AppDataSource.getRepository(Event);
const seatRepo = AppDataSource.getRepository(Seat);

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
  async getEventSeats(req: Request, res: Response) {
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

      console.log(`Event found: ${event.id}, Venue: ${event.venue?.id || 'No venue'}`);

      // Get venue ID from event
      const venueId = event.venue?.id;
      
      if (!venueId) {
        console.log('Venue not found for this event');
        return res.status(404).json({
          success: false,
          message: 'Venue not found for this event'
        });
      }
      
      // Get all seats for this venue
      const venueSeats = await seatRepo.find({
        where: { venue: { id: venueId } },
        order: {
          row: 'ASC',
          seatNumber: 'ASC'
        }
      });
      
      console.log(`Found ${venueSeats.length} venue seats for venue: ${venueId}`);
      
      // 如果没有找到座位，返回一个默认的座位排布
      if (venueSeats.length === 0) {
        console.log('No seats found for this venue. Creating default seat layout.');
        // 创建默认座位排布 - 5行，每行10个座位
        const defaultRows = 5;
        const defaultSeatsPerRow = 10;
        
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
            totalRows: defaultRows,
            maxColumns: defaultSeatsPerRow,
            totalSeats: defaultRows * defaultSeatsPerRow,
            availableSeats: defaultRows * defaultSeatsPerRow,
            bookedSeats: 0,
            lockedSeats: 0,
            unavailableSeats: 0
          }
        };
        
        // 创建默认座位排布
        for (let row = 1; row <= defaultRows; row++) {
          const rowKey = String.fromCharCode(64 + row); // A, B, C, D, E...
          seatMap.rows[rowKey] = [];
          
          for (let seat = 1; seat <= defaultSeatsPerRow; seat++) {
            seatMap.rows[rowKey].push({
              id: row * 100 + seat, // 生成一个虚拟ID
              seatNumber: seat.toString(),
              status: SeatStatus.AVAILABLE,
              price: 100, // 默认价格
              type: 'Standard',
              isAccessible: false
            });
          }
        }
        
        return res.status(200).json({
          success: true,
          message: 'Default seat layout created (no actual seats found)',
          data: seatMap
        });
      }
      
      // Get all seats specifically for this event (these will have status information)
      const eventSeats = await seatRepo.find({
        where: { event: { id: eventId } },
        order: {
          row: 'ASC',
          seatNumber: 'ASC'
        }
      });
      
      console.log(`Found ${eventSeats.length} event-specific seats for event: ${eventId}`);
      
      // Create a map of event seats for quick lookup
      const eventSeatMap = new Map();
      eventSeats.forEach(seat => {
        const key = `${seat.row}-${seat.seatNumber}`;
        eventSeatMap.set(key, seat);
      });

      // Count seats by status
      let totalSeats = 0;
      let availableSeats = 0;
      let bookedSeats = 0;
      let lockedSeats = 0;
      let unavailableSeats = 0;
      
      // Get unique rows and max columns
      const uniqueRows = new Set();
      let maxColumns = 0;
      
      venueSeats.forEach(seat => {
        uniqueRows.add(seat.row);
        const seatNum = parseInt(seat.seatNumber);
        if (!isNaN(seatNum) && seatNum > maxColumns) {
          maxColumns = seatNum;
        }
        
        totalSeats++;
        
        // Check event-specific status
        const key = `${seat.row}-${seat.seatNumber}`;
        const eventSeat = eventSeatMap.get(key);
        const status = eventSeat ? eventSeat.status : SeatStatus.AVAILABLE;
        
        switch (status) {
          case SeatStatus.AVAILABLE:
            availableSeats++;
            break;
          case SeatStatus.BOOKED:
            bookedSeats++;
            break;
          case SeatStatus.LOCKED:
            lockedSeats++;
            break;
          case SeatStatus.UNAVAILABLE:
            unavailableSeats++;
            break;
        }
      });

      console.log(`Unique rows: ${uniqueRows.size}, Max columns: ${maxColumns}, Total seats: ${totalSeats}`);

      // Format seat data for frontend
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
          totalRows: uniqueRows.size,
          maxColumns,
          totalSeats,
          availableSeats,
          bookedSeats,
          lockedSeats,
          unavailableSeats
        }
      };

      // 初始化所有行
      uniqueRows.forEach(row => {
        seatMap.rows[row as string] = [];
      });

      // Organize seats by row
      venueSeats.forEach(seat => {
        // Check if this seat has specific event status
        const key = `${seat.row}-${seat.seatNumber}`;
        const eventSeat = eventSeatMap.get(key);
        
        seatMap.rows[seat.row].push({
          id: seat.id,
          seatNumber: seat.seatNumber,
          // Use event-specific status if available, otherwise default to available
          status: eventSeat ? eventSeat.status : SeatStatus.AVAILABLE,
          price: eventSeat ? eventSeat.price : seat.price,
          type: seat.type,
          isAccessible: seat.isAccessible
        });
      });

      console.log(`Generated seat map with ${Object.keys(seatMap.rows).length} rows`);

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
  }
};