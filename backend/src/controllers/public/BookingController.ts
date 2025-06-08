import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { bookingCreateSchema, bookingCancelSchema, bookingQuerySchema } from '../../schemas/booking';
import { AppDataSource } from '../../config/data-source';
import { Booking, BookingStatus } from '../../entities/Booking';
import { Event } from '../../entities/Event';
import { Seat } from '../../entities/Seat';

const bookingRepo = AppDataSource.getRepository(Booking);
const eventRepo = AppDataSource.getRepository(Event);
const seatRepo = AppDataSource.getRepository(Seat);

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

      // TODO: DB integration - Fetch booking details
      // This should:
      // 1. Get booking with associated tickets and seats
      // 2. Verify user owns the booking
      // 3. Include event details
      const mockBooking = {
        id,
        event: {
          id: 'event-1',
          title: 'Sample Event',
          date: new Date().toISOString(),
          venue: 'Main Hall'
        },
        status: BookingStatus.CONFIRMED,
        seats: [
          { id: 'seat-1', number: 'A1', section: 'A' }
        ],
        tickets: [
          { id: 'ticket-1', type: 'REGULAR', status: 'active' }
        ],
        totalAmount: 50,
        createdAt: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        message: 'Booking details retrieved successfully',
        data: mockBooking
      });
    } catch (err: unknown) {
      console.error('Error fetching booking details:', err);
      res.status(404).json({
        success: false,
        message: 'Booking not found',
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
  }
};