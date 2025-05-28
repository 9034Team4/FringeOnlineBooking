import { TicketService } from '../TicketService';
import { Ticket, TicketType, TicketStatus } from '@entities/Ticket';
import { Event } from '@entities/Event';
import { User } from '@entities/User';
import { Venue } from '@entities/Venue';
import { EventCategory } from '@entities/EventCategory';
import { Repository } from 'typeorm';
import { AppDataSource } from '@config/data-source';

jest.mock('typeorm');
jest.mock('@config/data-source');
jest.mock('qrcode');

describe('TicketService', () => {
    let ticketService: TicketService;
    let mockTicketRepository: jest.Mocked<Repository<Ticket>>;
    let mockEventRepository: jest.Mocked<Repository<Event>>;
    let mockUserRepository: jest.Mocked<Repository<User>>;

    beforeEach(() => {
        mockTicketRepository = {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
        } as any;

        mockEventRepository = {
            findOne: jest.fn(),
            save: jest.fn(),
        } as any;

        mockUserRepository = {
            findOne: jest.fn(),
        } as any;

        (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
            if (entity === Ticket) return mockTicketRepository;
            if (entity === Event) return mockEventRepository;
            if (entity === User) return mockUserRepository;
            return null;
        });

        ticketService = new TicketService();
    });

    describe('createTicket', () => {
        it('should create a ticket successfully', async () => {
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
                availableCapacity: 10,
                basePrice: 50,
                totalBookings: 0,
                isSoldOut: false,
                name: 'Test Event',
                description: 'Test Description',
                startTime: new Date(),
                endTime: new Date(Date.now() + 3600000),
                isActive: true,
                totalCapacity: 100,
                hasSeatingPlan: false,
                seatingPlan: {
                    rows: 0,
                    columns: 0,
                    sections: []
                },
                tickets: [],
                totalRevenue: 0,
                status: 'DRAFT',
                venue: mockVenue,
                category: mockCategory,
                organizer: {
                    id: 'organizer-1',
                    email: 'organizer@example.com',
                    password: 'hashedpassword',
                    firstName: 'John',
                    lastName: 'Doe',
                    role: 'ORGANIZER',
                    isVerified: true,
                    isActive: true,
                    tickets: [],
                    bookings: [],
                    events: [],
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                bookings: [],
                createdAt: new Date(),
                updatedAt: new Date()
            } as Event;

            const mockUser = {
                id: 'user-1',
                email: 'user@example.com',
                password: 'hashedpassword',
                firstName: 'Jane',
                lastName: 'Doe',
                role: 'USER',
                isVerified: true,
                isActive: true,
                events: [],
                bookings: [],
                tickets: [],
                createdAt: new Date(),
                updatedAt: new Date()
            } as User;

            const mockTicket = {
                id: 'ticket-1',
                event: mockEvent,
                user: mockUser,
                type: TicketType.REGULAR,
                price: 50,
                status: TicketStatus.VALID,
                qrCode: 'qr-code',
                isScanned: false,
                isRefunded: false,
                createdAt: new Date(),
                updatedAt: new Date()
            } as Ticket;

            mockEventRepository.findOne.mockResolvedValue(mockEvent);
            mockUserRepository.findOne.mockResolvedValue(mockUser);
            mockTicketRepository.create.mockReturnValue(mockTicket);
            mockTicketRepository.save.mockResolvedValue(mockTicket);
            mockEventRepository.save.mockResolvedValue(mockEvent);

            const result = await ticketService.createTicket(
                'event-1',
                'user-1',
                TicketType.REGULAR
            );

            expect(result).toEqual(mockTicket);
            expect(mockEventRepository.save).toHaveBeenCalledWith({
                ...mockEvent,
                availableCapacity: 9,
                totalBookings: 1,
            });
        });

        it('should throw error if event not found', async () => {
            mockEventRepository.findOne.mockResolvedValue(null);

            await expect(
                ticketService.createTicket('event-1', 'user-1', TicketType.REGULAR)
            ).rejects.toThrow('Event not found');
        });

        it('should throw error if event is sold out', async () => {
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
                availableCapacity: 0,
                isSoldOut: true,
                name: 'Test Event',
                description: 'Test Description',
                startTime: new Date(),
                endTime: new Date(Date.now() + 3600000),
                isActive: true,
                totalCapacity: 100,
                basePrice: 50,
                hasSeatingPlan: false,
                seatingPlan: {
                    rows: 0,
                    columns: 0,
                    sections: []
                },
                tickets: [],
                totalRevenue: 0,
                totalBookings: 100,
                status: 'DRAFT',
                venue: mockVenue,
                category: mockCategory,
                organizer: {
                    id: 'organizer-1',
                    email: 'organizer@example.com',
                    password: 'hashedpassword',
                    firstName: 'John',
                    lastName: 'Doe',
                    role: 'ORGANIZER',
                    isVerified: true,
                    isActive: true,
                    tickets: [],
                    bookings: [],
                    events: [],
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                bookings: [],
                createdAt: new Date(),
                updatedAt: new Date()
            } as Event;

            mockEventRepository.findOne.mockResolvedValue(mockEvent);

            await expect(
                ticketService.createTicket('event-1', 'user-1', TicketType.REGULAR)
            ).rejects.toThrow('Event is sold out');
        });
    });

    describe('validateTicket', () => {
        it('should validate ticket successfully', async () => {
            const mockTicket = {
                id: 'ticket-1',
                isScanned: false,
                status: TicketStatus.VALID,
            } as Ticket;

            mockTicketRepository.findOne.mockResolvedValue(mockTicket);
            mockTicketRepository.save.mockResolvedValue(mockTicket);

            const result = await ticketService.validateTicket('ticket-1', 'scanner-1');

            expect(result).toBe(true);
            expect(mockTicketRepository.save).toHaveBeenCalledWith({
                ...mockTicket,
                isScanned: true,
                scannedAt: expect.any(Date),
                scannedBy: 'scanner-1',
            });
        });

        it('should throw error if ticket not found', async () => {
            mockTicketRepository.findOne.mockResolvedValue(null);

            await expect(
                ticketService.validateTicket('ticket-1', 'scanner-1')
            ).rejects.toThrow('Ticket not found');
        });

        it('should throw error if ticket already scanned', async () => {
            const mockTicket = {
                id: 'ticket-1',
                isScanned: true,
            } as Ticket;

            mockTicketRepository.findOne.mockResolvedValue(mockTicket);

            await expect(
                ticketService.validateTicket('ticket-1', 'scanner-1')
            ).rejects.toThrow('Ticket already scanned');
        });
    });

    describe('getTicketDetails', () => {
        it('should return ticket details', async () => {
            const mockTicket = {
                id: 'ticket-1',
                event: { id: 'event-1' },
                user: { id: 'user-1' },
            } as Ticket;

            mockTicketRepository.findOne.mockResolvedValue(mockTicket);

            const result = await ticketService.getTicketDetails('ticket-1');

            expect(result).toEqual(mockTicket);
            expect(mockTicketRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'ticket-1' },
                relations: ['event', 'user'],
            });
        });

        it('should throw error if ticket not found', async () => {
            mockTicketRepository.findOne.mockResolvedValue(null);

            await expect(
                ticketService.getTicketDetails('ticket-1')
            ).rejects.toThrow('Ticket not found');
        });
    });

    describe('getUserTickets', () => {
        it('should return user tickets', async () => {
            const mockTickets = [
                { id: 'ticket-1', event: { id: 'event-1' } },
                { id: 'ticket-2', event: { id: 'event-2' } },
            ] as Ticket[];

            mockTicketRepository.find.mockResolvedValue(mockTickets);

            const result = await ticketService.getUserTickets('user-1');

            expect(result).toEqual(mockTickets);
            expect(mockTicketRepository.find).toHaveBeenCalledWith({
                where: { user: { id: 'user-1' } },
                relations: ['event'],
                order: { createdAt: 'DESC' },
            });
        });
    });

    describe('cancelTicket', () => {
        it('should cancel ticket successfully', async () => {
            const mockEvent = {
                id: 'event-1',
                availableCapacity: 9,
                totalBookings: 1,
                isSoldOut: true,
            } as Event;

            const mockTicket = {
                id: 'ticket-1',
                event: mockEvent,
                isScanned: false,
            } as Ticket;

            mockTicketRepository.findOne.mockResolvedValue(mockTicket);
            mockTicketRepository.save.mockResolvedValue(mockTicket);
            mockEventRepository.save.mockResolvedValue(mockEvent);

            const result = await ticketService.cancelTicket('ticket-1', 'Cancellation reason');

            expect(result).toEqual(mockTicket);
            expect(mockTicketRepository.save).toHaveBeenCalledWith({
                ...mockTicket,
                status: TicketStatus.CANCELLED,
                isRefunded: true,
                refundedAt: expect.any(Date),
                refundReason: 'Cancellation reason',
            });
            expect(mockEventRepository.save).toHaveBeenCalledWith({
                ...mockEvent,
                availableCapacity: 10,
                totalBookings: 0,
                isSoldOut: false,
            });
        });

        it('should throw error if ticket not found', async () => {
            mockTicketRepository.findOne.mockResolvedValue(null);

            await expect(
                ticketService.cancelTicket('ticket-1', 'reason')
            ).rejects.toThrow('Ticket not found');
        });

        it('should throw error if ticket already scanned', async () => {
            const mockTicket = {
                id: 'ticket-1',
                isScanned: true,
            } as Ticket;

            mockTicketRepository.findOne.mockResolvedValue(mockTicket);

            await expect(
                ticketService.cancelTicket('ticket-1', 'reason')
            ).rejects.toThrow('Cannot cancel a scanned ticket');
        });
    });
}); 