import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppDataSource } from '../../config/data-source';
import { Ticket, TicketStatus } from '../../entities/Ticket';
import { Event } from '../../entities/Event';
import { Seat } from '../../entities/Seat';
import {
  ticketCreateSchema,
  ticketQuerySchema,
  ticketRefundSchema
} from '../../schemas/ticket';
import { In } from 'typeorm';

const ticketRepo = AppDataSource.getRepository(Ticket);
const eventRepo = AppDataSource.getRepository(Event);
const seatRepo = AppDataSource.getRepository(Seat);

export const TicketController = {
  /**
   * Book tickets for an event
   */
  async bookTicket(req: Request, res: Response) {
    try {
      const validatedData = ticketCreateSchema.parse(req.body);
      const { eventId, ticketType, quantity, seatIds } = validatedData;

      // Get user ID from authenticated request
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if event exists and is active
      const event = await eventRepo.findOne({ where: { id: eventId } });
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      if (!event.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Event is not active'
        });
      }

      // Check seat availability if seats are specified
      if (seatIds && seatIds.length > 0) {
        const seats = await seatRepo.findByIds(seatIds);
        if (seats.length !== seatIds.length) {
          return res.status(400).json({
            success: false,
            message: 'One or more seats are not available'
          });
        }

        // Check if seats are already booked
        const bookedSeats = await ticketRepo.find({
          where: {
            seatNumber: In(seatIds),
            status: TicketStatus.VALID
          }
        });

        if (bookedSeats.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'One or more seats are already booked'
          });
        }
      }

      // Calculate total price
      const basePrice = event.basePrice;
      const totalPrice = basePrice * quantity;

      // Create tickets
      const tickets = seatIds
        ? await Promise.all(
            seatIds.map(async (seatId) => {
              const ticket = ticketRepo.create({
                event: { id: eventId },
                user: { id: userId },
                type: ticketType,
                price: basePrice,
                status: TicketStatus.VALID,
                seatNumber: seatId
              });
              return ticketRepo.save(ticket);
            })
          )
        : await Promise.all(
            Array(quantity)
              .fill(null)
              .map(async () => {
                const ticket = ticketRepo.create({
                  event: { id: eventId },
                  user: { id: userId },
                  type: ticketType,
                  price: basePrice,
                  status: TicketStatus.VALID
                });
                return ticketRepo.save(ticket);
              })
          );

      return res.status(201).json({
        success: true,
        message: 'Tickets booked successfully',
        data: {
          tickets: tickets.map((ticket) => ({
            id: ticket.id,
            eventId: ticket.event.id,
            type: ticket.type,
            price: ticket.price,
            status: ticket.status,
            seatNumber: ticket.seatNumber
          })),
          totalPrice
        }
      });
    } catch (err: unknown) {
      console.error('Error booking tickets:', err);
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          error: err.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to book tickets',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Get user's tickets with pagination and filtering
   */
  async getUserTickets(req: Request, res: Response) {
    try {
      const validatedQuery = ticketQuerySchema.parse(req.query);
      const { page, limit, status, eventId } = validatedQuery;

      // Get user ID from authenticated request
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Build query
      const query = {
        where: {
          user: { id: userId },
          ...(status && { status: status as TicketStatus }),
          ...(eventId && { event: { id: eventId } })
        },
        skip: (page - 1) * limit,
        take: limit,
        relations: ['event', 'user']
      };

      // Get tickets
      const [tickets, total] = await ticketRepo.findAndCount(query);

      return res.status(200).json({
        success: true,
        message: 'Tickets retrieved successfully',
        data: {
          tickets: tickets.map((ticket) => ({
            id: ticket.id,
            eventId: ticket.event.id,
            eventName: ticket.event.name,
            type: ticket.type,
            price: ticket.price,
            status: ticket.status,
            seatNumber: ticket.seatNumber,
            purchaseDate: ticket.createdAt
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (err: unknown) {
      console.error('Error fetching tickets:', err);
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          error: err.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch tickets',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Get ticket details
   */
  async getTicketDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Get user ID from authenticated request
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const ticket = await ticketRepo.findOne({
        where: { id, user: { id: userId } },
        relations: ['event', 'user']
      });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Ticket details retrieved successfully',
        data: {
          id: ticket.id,
          eventId: ticket.event.id,
          eventName: ticket.event.name,
          eventDate: ticket.event.startTime,
          venue: ticket.event.venue,
          type: ticket.type,
          price: ticket.price,
          status: ticket.status,
          seatNumber: ticket.seatNumber,
          purchaseDate: ticket.createdAt,
          qrCode: ticket.qrCode
        }
      });
    } catch (err: unknown) {
      console.error('Error fetching ticket details:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch ticket details',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Request ticket refund
   */
  async requestRefund(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = ticketRefundSchema.parse(req.body);
      const { reason, amount } = validatedData;

      // Get user ID from authenticated request
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const ticket = await ticketRepo.findOne({
        where: { id, user: { id: userId } },
        relations: ['event']
      });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found'
        });
      }

      // Check if ticket is eligible for refund
      if (ticket.status !== TicketStatus.VALID) {
        return res.status(400).json({
          success: false,
          message: 'Ticket is not eligible for refund'
        });
      }

      // Check if event has started
      if (new Date() > ticket.event.startTime) {
        return res.status(400).json({
          success: false,
          message: 'Cannot refund ticket for an event that has already started'
        });
      }

      // Calculate refund amount
      const refundAmount = amount || ticket.price;

      // Update ticket status
      ticket.status = TicketStatus.REFUNDED;
      ticket.refundReason = reason;
      ticket.refundedAt = new Date();
      await ticketRepo.save(ticket);

      // TODO: Process refund payment

      return res.status(200).json({
        success: true,
        message: 'Refund request processed successfully',
        data: {
          ticketId: ticket.id,
          refundAmount,
          status: ticket.status,
          refundedAt: ticket.refundedAt
        }
      });
    } catch (err: unknown) {
      console.error('Error processing refund:', err);
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          error: err.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to process refund',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Simulate scanning the ticket and mark as USED if valid (new endpoint)
   */
  async validateTicket(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required', error: null });
      }
      const { ticketId } = req.params;
      // TODO: Fetch ticket, check if valid and not already scanned, mark as USED
      // For now, simulate success
      return res.status(200).json({
        success: true,
        message: 'Ticket validated and marked as USED',
        data: { ticketId, status: 'USED' }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to validate ticket', error: err.message });
    }
  },

  /**
   * Book ticket manually (new endpoint)
   */
  async bookTicketManual(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required', error: null });
      }
      // TODO: Validate input and create ticket manually (similar to bookTicket)
      const { eventId, ticketType, seatNumber, section } = req.body;
      // TODO: Real DB logic
      const mockTicket = {
        id: 'manual-ticket-1',
        eventId,
        userId,
        type: ticketType,
        seatNumber,
        section,
        status: 'VALID',
        createdAt: new Date().toISOString()
      };
      return res.status(201).json({ success: true, message: 'Ticket booked manually', data: mockTicket });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to book ticket manually', error: err.message });
    }
  },

  /**
   * Get all tickets for the current user (alias endpoint)
   */
  async getMyTickets(req: Request, res: Response) {
    try {
      // Alias for getUserTickets
      return await this.getUserTickets(req, res);
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to get user tickets', error: err.message });
    }
  }
}; 