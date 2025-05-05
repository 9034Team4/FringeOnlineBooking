import { EventService } from '../EventService';
import { Event, EventStatus } from '@entities/Event';
import { User, UserRole } from '@entities/User';
import { Repository } from 'typeorm';
import { AppDataSource } from '@config/db';
import { Venue } from '@entities/Venue';
import { EventCategory } from '@entities/EventCategory';

jest.mock('typeorm');
jest.mock('@config/db');

describe('EventService', () => {
    let eventService: EventService;
    let mockEventRepository: jest.Mocked<Repository<Event>>;
    let mockUserRepository: jest.Mocked<Repository<User>>;

    beforeEach(() => {
        mockEventRepository = {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            delete: jest.fn(),
        } as any;

        mockUserRepository = {
            findOne: jest.fn(),
        } as any;

        (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
            if (entity === Event) return mockEventRepository;
            if (entity === User) return mockUserRepository;
            return null;
        });

        eventService = new EventService();
    });

    describe('createEvent', () => {
        it('should create an event successfully', async () => {
            const mockOrganizer = {
                id: 'user-1',
                email: 'organizer@example.com',
                password: 'hashedpassword',
                firstName: 'John',
                lastName: 'Doe',
                role: UserRole.ORGANIZER,
                isVerified: true,
                isActive: true,
                events: [],
                bookings: [],
                tickets: [],
                createdAt: new Date(),
                updatedAt: new Date()
            } as User;

            const mockVenue = {
                id: 1,
                name: 'Test Venue',
                location: 'Test Location',
                events: [],
                seats: []
            } as Venue;

            const mockCategory = {
                id: 1,
                name: 'Test Category',
                events: []
            } as EventCategory;

            const mockEvent = {
                id: 'event-1',
                name: 'Test Event',
                description: 'Test Description',
                startTime: new Date(),
                endTime: new Date(Date.now() + 3600000),
                venue: mockVenue,
                category: mockCategory,
                isActive: true,
                totalCapacity: 100,
                availableCapacity: 100,
                basePrice: 50,
                hasSeatingPlan: false,
                seatingPlan: {
                    rows: 0,
                    columns: 0,
                    sections: []
                },
                tickets: [],
                isSoldOut: false,
                totalRevenue: 0,
                totalBookings: 0,
                status: EventStatus.DRAFT,
                organizer: mockOrganizer,
                bookings: [],
                createdAt: new Date(),
                updatedAt: new Date()
            } as Event;

            mockUserRepository.findOne.mockResolvedValue(mockOrganizer);
            mockEventRepository.create.mockReturnValue(mockEvent);
            mockEventRepository.save.mockResolvedValue(mockEvent);

            const result = await eventService.createEvent('user-1', {
                name: 'Test Event',
                description: 'Test Description',
                startTime: new Date(),
                endTime: new Date(Date.now() + 3600000),
                venue: 'Test Venue',
                category: 'Test Category',
                capacity: 100,
                basePrice: 50,
            });

            expect(result).toEqual(mockEvent);
            expect(mockEventRepository.save).toHaveBeenCalledWith(mockEvent);
        });

        it('should throw error if organizer not found', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            await expect(
                eventService.createEvent('user-1', {
                    name: 'Test Event',
                    description: 'Test Description',
                    startTime: new Date(),
                    endTime: new Date(Date.now() + 3600000),
                    venue: 'Test Venue',
                    category: 'Test Category',
                    capacity: 100,
                    basePrice: 50,
                })
            ).rejects.toThrow('Organizer not found');
        });

        it('should throw error if user is not an organizer', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'user@example.com',
                password: 'hashedpassword',
                firstName: 'John',
                lastName: 'Doe',
                role: UserRole.USER,
                isVerified: true,
                isActive: true,
                events: [],
                bookings: [],
                tickets: [],
                createdAt: new Date(),
                updatedAt: new Date()
            } as User;

            mockUserRepository.findOne.mockResolvedValue(mockUser);

            await expect(
                eventService.createEvent('user-1', {
                    name: 'Test Event',
                    description: 'Test Description',
                    startTime: new Date(),
                    endTime: new Date(Date.now() + 3600000),
                    venue: 'Test Venue',
                    category: 'Test Category',
                    capacity: 100,
                    basePrice: 50,
                })
            ).rejects.toThrow('User is not an organizer');
        });

        it('should throw error if end time is before start time', async () => {
            const mockOrganizer = {
                id: 'user-1',
                email: 'organizer@example.com',
                password: 'hashedpassword',
                firstName: 'John',
                lastName: 'Doe',
                role: UserRole.ORGANIZER,
            } as User;

            mockUserRepository.findOne.mockResolvedValue(mockOrganizer);

            await expect(
                eventService.createEvent('user-1', {
                    name: 'Test Event',
                    description: 'Test Description',
                    startTime: new Date(Date.now() + 3600000),
                    endTime: new Date(),
                    venue: 'Test Venue',
                    category: 'Test Category',
                    capacity: 100,
                    basePrice: 50,
                })
            ).rejects.toThrow('End time must be after start time');
        });
    });

    describe('updateEvent', () => {
        it('should update event successfully', async () => {
            const mockOrganizer = {
                id: 'user-1',
                email: 'organizer@example.com',
                password: 'hashedpassword',
                firstName: 'John',
                lastName: 'Doe',
                role: UserRole.ORGANIZER,
                isVerified: true,
                isActive: true,
            } as User;

            const mockVenue = {
                id: 1,
                name: 'Test Venue',
                location: 'Test Location',
                events: [],
                seats: []
            } as Venue;

            const mockCategory = {
                id: 1,
                name: 'Test Category',
                events: []
            } as EventCategory;

            const mockEvent = {
                id: 'event-1',
                name: 'Test Event',
                description: 'Test Description',
                startTime: new Date(),
                endTime: new Date(Date.now() + 3600000),
                venue: mockVenue,
                category: mockCategory,
                isActive: true,
                totalCapacity: 100,
                availableCapacity: 100,
                basePrice: 50,
                hasSeatingPlan: false,
                seatingPlan: {
                    rows: 0,
                    columns: 0,
                    sections: []
                },
                tickets: [],
                isSoldOut: false,
                totalRevenue: 0,
                totalBookings: 0,
                status: EventStatus.DRAFT,
                organizer: {
                    id: 'user-1',
                    email: 'organizer@example.com',
                    password: 'hashedpassword',
                    firstName: 'John',
                    lastName: 'Doe',
                    role: UserRole.ORGANIZER,
                    isVerified: true,
                    isActive: true,
                    events: [],
                    bookings: [],
                    tickets: [],
                    createdAt: new Date(),
                    updatedAt: new Date()
                } as User,
                bookings: [],
                createdAt: new Date(),
                updatedAt: new Date()
            } as Event;

            mockEventRepository.findOne.mockResolvedValue(mockEvent);
            mockEventRepository.save.mockResolvedValue({
                ...mockEvent,
                name: 'Updated Event',
            });

            const result = await eventService.updateEvent('event-1', 'user-1', {
                name: 'Updated Event',
            });

            expect(result.name).toBe('Updated Event');
            expect(mockEventRepository.save).toHaveBeenCalled();
        });

        it('should throw error if event not found', async () => {
            mockEventRepository.findOne.mockResolvedValue(null);

            await expect(
                eventService.updateEvent('event-1', 'user-1', {
                    name: 'Updated Event',
                })
            ).rejects.toThrow('Event not found');
        });

        it('should throw error if user is not the organizer', async () => {
            const mockEvent = {
                id: 'event-1',
                organizer: { id: 'user-2' },
            } as Event;

            mockEventRepository.findOne.mockResolvedValue(mockEvent);

            await expect(
                eventService.updateEvent('event-1', 'user-1', {
                    name: 'Updated Event',
                })
            ).rejects.toThrow('User is not the organizer of this event');
        });

        it('should throw error if new capacity is less than current bookings', async () => {
            const mockOrganizer = {
                id: 'user-1',
                email: 'organizer@example.com',
                password: 'hashedpassword',
                firstName: 'John',
                lastName: 'Doe',
                role: UserRole.ORGANIZER,
                isVerified: true,
                isActive: true,
                events: [],
                bookings: [],
                tickets: [],
                createdAt: new Date(),
                updatedAt: new Date()
            } as User;

            const mockVenue = {
                id: 1,
                name: 'Test Venue',
                location: 'Test Location',
                events: [],
                seats: []
            } as Venue;

            const mockCategory = {
                id: 1,
                name: 'Test Category',
                events: []
            } as EventCategory;

            const mockEvent = {
                id: 'event-1',
                name: 'Test Event',
                description: 'Test Description',
                startTime: new Date(),
                endTime: new Date(Date.now() + 3600000),
                venue: mockVenue,
                category: mockCategory,
                isActive: true,
                totalCapacity: 100,
                availableCapacity: 50,
                basePrice: 50,
                hasSeatingPlan: false,
                seatingPlan: {
                    rows: 0,
                    columns: 0,
                    sections: []
                },
                tickets: [],
                isSoldOut: false,
                totalRevenue: 0,
                totalBookings: 50,
                status: EventStatus.DRAFT,
                organizer: mockOrganizer,
                bookings: [],
                createdAt: new Date(),
                updatedAt: new Date()
            } as Event;

            mockEventRepository.findOne.mockResolvedValue(mockEvent);

            await expect(
                eventService.updateEvent('event-1', 'user-1', {
                    capacity: 40,
                })
            ).rejects.toThrow('New capacity cannot be less than current bookings');
        });
    });

    describe('getEventDetails', () => {
        it('should return event details', async () => {
            const mockVenue = {
                id: 1,
                name: 'Test Venue',
                location: 'Test Location',
                events: [],
                seats: []
            } as Venue;

            const mockCategory = {
                id: 1,
                name: 'Test Category',
                events: []
            } as EventCategory;

            const mockEvent = {
                id: 'event-1',
                name: 'Test Event',
                description: 'Test Description',
                startTime: new Date(),
                endTime: new Date(Date.now() + 3600000),
                venue: mockVenue,
                category: mockCategory,
                isActive: true,
                totalCapacity: 100,
                availableCapacity: 100,
                basePrice: 50,
                hasSeatingPlan: false,
                seatingPlan: {
                    rows: 0,
                    columns: 0,
                    sections: []
                },
                tickets: [],
                isSoldOut: false,
                totalRevenue: 0,
                totalBookings: 0,
                status: EventStatus.DRAFT,
                organizer: {
                    id: 'user-1',
                    email: 'organizer@example.com',
                    password: 'hashedpassword',
                    firstName: 'John',
                    lastName: 'Doe',
                    role: UserRole.ORGANIZER,
                    isVerified: true,
                    isActive: true,
                    events: [],
                    bookings: [],
                    tickets: [],
                    createdAt: new Date(),
                    updatedAt: new Date()
                } as User,
                bookings: [],
                createdAt: new Date(),
                updatedAt: new Date()
            } as Event;

            mockEventRepository.findOne.mockResolvedValue(mockEvent);

            const result = await eventService.getEventDetails('event-1');

            expect(result).toEqual(mockEvent);
            expect(mockEventRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'event-1' },
                relations: ['organizer'],
            });
        });

        it('should throw error if event not found', async () => {
            mockEventRepository.findOne.mockResolvedValue(null);

            await expect(
                eventService.getEventDetails('event-1')
            ).rejects.toThrow('Event not found');
        });
    });

    describe('listEvents', () => {
        it('should return list of events', async () => {
            const mockEvents = [
                {
                    id: 'event-1',
                    name: 'Test Event 1',
                    status: EventStatus.UPCOMING,
                },
                {
                    id: 'event-2',
                    name: 'Test Event 2',
                    status: EventStatus.UPCOMING,
                },
            ] as Event[];

            mockEventRepository.find.mockResolvedValue(mockEvents);

            const result = await eventService.listEvents({
                status: EventStatus.UPCOMING,
                page: 1,
                limit: 10,
            });

            expect(result).toEqual(mockEvents);
            expect(mockEventRepository.find).toHaveBeenCalledWith({
                where: { status: EventStatus.UPCOMING },
                relations: ['organizer'],
                skip: 0,
                take: 10,
                order: { startTime: 'ASC' },
            });
        });
    });

    describe('deleteEvent', () => {
        it('should delete event successfully', async () => {
            const mockOrganizer = {
                id: 'user-1',
                email: 'organizer@example.com',
                password: 'hashedpassword',
                firstName: 'John',
                lastName: 'Doe',
                role: UserRole.ORGANIZER,
                isVerified: true,
                isActive: true,
            } as User;

            const mockVenue = {
                id: 1,
                name: 'Test Venue',
                location: 'Test Location',
                events: [],
                seats: []
            } as Venue;

            const mockCategory = {
                id: 1,
                name: 'Test Category',
                events: []
            } as EventCategory;

            const mockEvent = {
                id: 'event-1',
                totalBookings: 0,
                venue: mockVenue,
                category: mockCategory,
                organizer: mockOrganizer,
            } as Event;

            mockEventRepository.findOne.mockResolvedValue(mockEvent);
            mockEventRepository.delete.mockResolvedValue({ affected: 1 } as any);

            await eventService.deleteEvent('event-1', 'user-1');

            expect(mockEventRepository.delete).toHaveBeenCalledWith('event-1');
        });

        it('should throw error if event not found', async () => {
            mockEventRepository.findOne.mockResolvedValue(null);

            await expect(
                eventService.deleteEvent('event-1', 'user-1')
            ).rejects.toThrow('Event not found');
        });

        it('should throw error if user is not the organizer', async () => {
            const mockEvent = {
                id: 'event-1',
                organizer: { id: 'user-2' },
            } as Event;

            mockEventRepository.findOne.mockResolvedValue(mockEvent);

            await expect(
                eventService.deleteEvent('event-1', 'user-1')
            ).rejects.toThrow('User is not the organizer of this event');
        });

        it('should throw error if event has existing bookings', async () => {
            const mockOrganizer = {
                id: 'user-1',
                email: 'organizer@example.com',
                password: 'hashedpassword',
                firstName: 'John',
                lastName: 'Doe',
                role: UserRole.ORGANIZER,
                isVerified: true,
                isActive: true,
            } as User;

            const mockVenue = {
                id: 1,
                name: 'Test Venue',
                location: 'Test Location',
                events: [],
                seats: []
            } as Venue;

            const mockCategory = {
                id: 1,
                name: 'Test Category',
                events: []
            } as EventCategory;

            const mockEvent = {
                id: 'event-1',
                totalBookings: 5,
                venue: mockVenue,
                category: mockCategory,
                organizer: mockOrganizer,
            } as Event;

            mockEventRepository.findOne.mockResolvedValue(mockEvent);

            await expect(
                eventService.deleteEvent('event-1', 'user-1')
            ).rejects.toThrow('Cannot delete event with existing bookings');
        });
    });
}); 