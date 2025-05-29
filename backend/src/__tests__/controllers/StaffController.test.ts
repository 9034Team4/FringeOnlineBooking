import { Request, Response } from 'express';
import { StaffController } from '../../controllers/admin/StaffController';
import { setupTestDatabase, createTestUser, cleanupTestDatabase } from '../utils/testUtils';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../../entities/User';

describe('StaffController', () => {
  let dataSource: DataSource;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any;

  beforeAll(async () => {
    dataSource = await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase(dataSource);
  });

  beforeEach(() => {
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
  });

  describe('listStaff', () => {
    it('should return all staff members', async () => {
      // Create test staff members
      const staff1 = await createTestUser(dataSource, UserRole.ADMIN);
      const staff2 = await createTestUser(dataSource, UserRole.ADMIN);

      await StaffController.listStaff(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.staff).toHaveLength(2);
      expect(responseObject.staff[0].role).toBe(UserRole.ADMIN);
      expect(responseObject.staff[1].role).toBe(UserRole.ADMIN);
    });
  });

  describe('getStaff', () => {
    it('should return a staff member by id', async () => {
      const staff = await createTestUser(dataSource, UserRole.ADMIN);
      mockRequest.params = { id: staff.id };

      await StaffController.getStaff(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.staff.id).toBe(staff.id);
      expect(responseObject.staff.role).toBe(UserRole.ADMIN);
    });

    it('should return 404 if staff not found', async () => {
      mockRequest.params = { id: 'non-existent-id' };

      await StaffController.getStaff(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Staff not found',
      });
    });
  });

  describe('createStaff', () => {
    it('should create a new staff member', async () => {
      const staffData = {
        name: 'New Staff',
        email: 'staff@example.com',
        password: 'password123',
        group: 'Group A',
        assignedEvent: 'Event 1',
        status: 'active',
      };
      mockRequest.body = staffData;

      await StaffController.createStaff(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.staff.name).toBe(staffData.name);
      expect(responseObject.staff.email).toBe(staffData.email);
      expect(responseObject.staff.role).toBe(UserRole.ADMIN);
    });
  });

  describe('updateStaff', () => {
    it('should update a staff member', async () => {
      const staff = await createTestUser(dataSource, UserRole.ADMIN);
      const updateData = {
        name: 'Updated Name',
        group: 'Group B',
      };
      mockRequest.params = { id: staff.id };
      mockRequest.body = updateData;

      await StaffController.updateStaff(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.staff.name).toBe(updateData.name);
      expect(responseObject.staff.group).toBe(updateData.group);
    });

    it('should return 404 if staff not found', async () => {
      mockRequest.params = { id: 'non-existent-id' };
      mockRequest.body = { name: 'Updated Name' };

      await StaffController.updateStaff(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Staff not found',
      });
    });
  });

  describe('deleteStaff', () => {
    it('should delete a staff member', async () => {
      const staff = await createTestUser(dataSource, UserRole.ADMIN);
      mockRequest.params = { id: staff.id };

      await StaffController.deleteStaff(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Staff deleted',
      });

      // Verify staff is actually deleted
      const deletedStaff = await dataSource
        .getRepository(User)
        .findOne({ where: { id: staff.id } });
      expect(deletedStaff).toBeNull();
    });

    it('should return 404 if staff not found', async () => {
      mockRequest.params = { id: 'non-existent-id' };

      await StaffController.deleteStaff(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Staff not found',
      });
    });
  });

  describe('updateGroup', () => {
    it('should update staff group', async () => {
      const staff = await createTestUser(dataSource, UserRole.ADMIN);
      const newGroup = 'New Group';
      mockRequest.params = { id: staff.id };
      mockRequest.body = { group: newGroup };

      await StaffController.updateGroup(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.staff.group).toBe(newGroup);
    });
  });

  describe('updateAssignedEvent', () => {
    it('should update staff assigned event', async () => {
      const staff = await createTestUser(dataSource, UserRole.ADMIN);
      const newEvent = 'New Event';
      mockRequest.params = { id: staff.id };
      mockRequest.body = { assignedEvent: newEvent };

      await StaffController.updateAssignedEvent(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.staff.assignedEvent).toBe(newEvent);
    });
  });

  describe('updateStatus', () => {
    it('should update staff status', async () => {
      const staff = await createTestUser(dataSource, UserRole.ADMIN);
      const newStatus = 'inactive';
      mockRequest.params = { id: staff.id };
      mockRequest.body = { status: newStatus };

      await StaffController.updateStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.staff.status).toBe(newStatus);
    });
  });
}); 