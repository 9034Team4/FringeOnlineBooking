import { Request, Response } from 'express';
import { TicketController } from '../../controllers/public/TicketController';
import { setupTestDatabase, createTestUser, createTestEvent, createTestBooking, createTestTicket, cleanupTestDatabase } from '../utils/testUtils';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../../entities/User';
import { Event } from '../../entities/Event';
import { Booking } from '../../entities/Booking';
import { Ticket, TicketStatus, TicketType } from '../../entities/Ticket';

describe('TicketController', () => {
  let dataSource: DataSource;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any;
  let user: User;
  let event: Event;
  let booking: Booking;

  beforeAll(async () => {
    dataSource = await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase(dataSource);
  });

  beforeEach(async () => {
    responseObject = {};
    mockRequest = {};
    mockResponse = {
      json: jest.fn().mockImplementation((result) => {
        responseObject = result;
        return mockResponse;
      }),
      status: jest.fn().mockImplementation((code) => {
        responseObject.status = code;
        return mockResponse;
      }),
    };

    // Create test data for each test
    user = await createTestUser(dataSource);
    const organizer = await createTestUser(dataSource, UserRole.ORGANIZER);
    event = await createTestEvent(dataSource, organizer);
    booking = await createTestBooking(dataSource, user, event);
  });

  describe('getUserTickets', () => {
    it('should return user tickets with pagination', async () => {
      // Create some test tickets
      await createTestTicket(dataSource, user, event, booking);
      await createTestTicket(dataSource, user, event, booking);

      mockRequest.user = { id: user.id };
      mockRequest.query = { page: '1', limit: '10' };

      await TicketController.getUserTickets(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.data.tickets).toHaveLength(2);
      expect(responseObject.data.pagination).toBeDefined();
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest.query = { page: '1', limit: '10' };

      await TicketController.getUserTickets(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });
  });

  describe('requestRefund', () => {
    it('should process refund request', async () => {
      const ticket = await createTestTicket(dataSource, user, event, booking);
      mockRequest.params = { id: ticket.id };
      mockRequest.user = { id: user.id };
      mockRequest.body = { reason: 'Cannot attend' };

      await TicketController.requestRefund(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(true);

      // Verify ticket status is updated
      const updatedTicket = await dataSource
        .getRepository(Ticket)
        .findOne({ where: { id: ticket.id } });
      expect(updatedTicket?.status).toBe(TicketStatus.REFUNDED);
    });

    it('should return 404 if ticket not found', async () => {
      mockRequest.params = { id: 'non-existent-id' };
      mockRequest.user = { id: user.id };
      mockRequest.body = { reason: 'Cannot attend' };

      await TicketController.requestRefund(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(false);
    });
  });

  describe('validateTicket', () => {
    it('should validate and mark ticket as used', async () => {
      const ticket = await createTestTicket(dataSource, user, event, booking);
      mockRequest.params = { id: ticket.id };
      mockRequest.user = { id: user.id };

      await TicketController.validateTicket(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(true);
      expect(responseObject.data.status).toBe('USED');

      // Verify ticket status is updated
      const updatedTicket = await dataSource
        .getRepository(Ticket)
        .findOne({ where: { id: ticket.id } });
      expect(updatedTicket?.status).toBe(TicketStatus.USED);
    });

    it('should return 404 if ticket not found', async () => {
      mockRequest.params = { id: 'non-existent-id' };
      mockRequest.user = { id: user.id };

      await TicketController.validateTicket(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(false);
    });
  });

  describe('bookTicketManual', () => {
    it('should create a ticket manually', async () => {
      const ticketData = {
        eventId: event.id,
        ticketType: TicketType.REGULAR,
        seatNumber: 'A1',
        section: 'VIP',
      };
      mockRequest.body = ticketData;
      mockRequest.user = { id: user.id };

      await TicketController.bookTicketManual(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(true);
      expect(responseObject.data.eventId).toBe(event.id);
      expect(responseObject.data.type).toBe(TicketType.REGULAR);
    });

    it('should return 401 if user not authenticated', async () => {
      const ticketData = {
        eventId: event.id,
        ticketType: TicketType.REGULAR,
        seatNumber: 'A1',
        section: 'VIP',
      };
      mockRequest.body = ticketData;

      await TicketController.bookTicketManual(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });
  });
}); 