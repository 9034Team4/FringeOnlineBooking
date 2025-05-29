import { Request, Response } from 'express';
import { EventController } from '../../controllers/admin/EventController';
import { setupTestDatabase, createTestUser, createTestEvent, cleanupTestDatabase } from '../utils/testUtils';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../../entities/User';
import { Event, EventStatus } from '../../entities/Event';

describe('EventController', () => {
  let dataSource: DataSource;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any;
  let organizer: User;

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

    // Create test organizer for each test
    organizer = await createTestUser(dataSource, UserRole.ORGANIZER);
  });

  describe('create', () => {
    it('should create a new event', async () => {
      const eventData = {
        name: 'Test Event',
        description: 'Test Description',
        startTime: new Date(Date.now() + 86400000),
        endTime: new Date(Date.now() + 172800000),
        basePrice: 100,
        totalCapacity: 100,
        availableCapacity: 100,
        category: 'Test Category',
        venue: 'Test Venue',
      };
      mockRequest.body = eventData;
      mockRequest.user = { id: organizer.id };

      await EventController.create(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.data.name).toBe(eventData.name);
      expect(responseObject.data.description).toBe(eventData.description);
    });

    it('should return 400 for invalid input data', async () => {
      const invalidEventData = {
        name: '', // Invalid empty name
        description: 'Test Description',
      };
      mockRequest.body = invalidEventData;
      mockRequest.user = { id: organizer.id };

      await EventController.create(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(false);
    });
  });

  describe('getById', () => {
    it('should return event by id', async () => {
      const event = await createTestEvent(dataSource, organizer);
      mockRequest.params = { id: event.id };

      await EventController.getById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.data.id).toBe(event.id);
    });

    it('should return 404 if event not found', async () => {
      mockRequest.params = { id: 'non-existent-id' };

      await EventController.getById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(false);
    });
  });

  describe('update', () => {
    it('should update an event', async () => {
      const event = await createTestEvent(dataSource, organizer);
      const updateData = {
        name: 'Updated Event Name',
        description: 'Updated Description',
      };
      mockRequest.params = { id: event.id };
      mockRequest.body = updateData;

      await EventController.update(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.data.name).toBe(updateData.name);
      expect(responseObject.data.description).toBe(updateData.description);
    });

    it('should return 404 if event not found', async () => {
      mockRequest.params = { id: 'non-existent-id' };
      mockRequest.body = { name: 'Updated Name' };

      await EventController.update(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(false);
    });
  });

  describe('remove', () => {
    it('should delete an event', async () => {
      const event = await createTestEvent(dataSource, organizer);
      mockRequest.params = { id: event.id };

      await EventController.remove(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(true);

      // Verify event is actually deleted
      const deletedEvent = await dataSource
        .getRepository(Event)
        .findOne({ where: { id: event.id } });
      expect(deletedEvent).toBeNull();
    });

    it('should return 404 if event not found', async () => {
      mockRequest.params = { id: 'non-existent-id' };

      await EventController.remove(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(false);
    });
  });
}); 