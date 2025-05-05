import { BookingService } from '../BookingService';
import { Booking, BookingStatus } from '@entities/Booking';
import { Event, EventStatus } from '@entities/Event';
import { User, UserRole } from '@entities/User';
import { Ticket, TicketStatus, TicketType } from '@entities/Ticket';
import { Repository } from 'typeorm';
import { AppDataSource } from '@config/db';

jest.mock('typeorm');
jest.mock('../../config/db');

describe('BookingService', () => {
    let bookingService: BookingService;
    let mockBookingRepository: jest.Mocked<Repository<Booking>>;
    let mockEventRepository: jest.Mocked<Repository<Event>>;
    let mockUserRepository: jest.Mocked<Repository<User>>;
    let mockTicketRepository: jest.Mocked<Repository<Ticket>>;

    beforeEach(() => {
        mockBookingRepository = {
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

        mockTicketRepository = {
            create: jest.fn(),
            save: jest.fn(),
        } as any;

        (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
            if (entity === Booking) return mockBookingRepository;
            if (entity === Event) return mockEventRepository;
            if (entity === User) return mockUserRepository;
            if (entity === Ticket) return mockTicketRepository;
            return null;
        });

        bookingService = new BookingService();
    });

    describe('createBooking', () => {
        it('should create a booking successfully', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe',
                role: UserRole.USER,
            } as User;

            const mockEvent = {
                id: 'event-1',
                name: 'Test Event',
                availableCapacity: 10,
                basePrice: 100,
                status: EventStatus.UPCOMING,
            } as Event;

            const mockBooking = {
                id: 'booking-1',
                user: mockUser,
                event: mockEvent,
                status: BookingStatus.PENDING,
                totalAmount: 200,
                paymentStatus: 'PENDING',
            } as Booking;

            const mockTickets = [
                {
                    id: 'ticket-1',
                    type: TicketType.REGULAR,
                    price: 100,
                    status: TicketStatus.VALID,
                },
                {
                    id: 'ticket-2',
                    type: TicketType.REGULAR,
                    price: 100,
                    status: TicketStatus.VALID,
                },
            ] as Ticket[];

            mockUserRepository.findOne.mockResolvedValue(mockUser);
            mockEventRepository.findOne.mockResolvedValue(mockEvent);
            mockBookingRepository.create.mockReturnValue(mockBooking);
            mockBookingRepository.save.mockResolvedValue(mockBooking);
            mockTicketRepository.create.mockReturnValue(mockTickets[0]);
            mockTicketRepository.save.mockResolvedValue(mockTickets[0]);

            const result = await bookingService.createBooking('user-1', 'event-1', 2);

            expect(result).toEqual(mockBooking);
            expect(mockEventRepository.save).toHaveBeenCalledWith({
                ...mockEvent,
                availableCapacity: 8,
                totalBookings: 2,
            });
        });

        it('should throw error if user not found', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            await expect(
                bookingService.createBooking('user-1', 'event-1', 2)
            ).rejects.toThrow('User not found');
        });

        it('should throw error if event not found', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe',
                role: UserRole.USER,
            } as User;

            mockUserRepository.findOne.mockResolvedValue(mockUser);
            mockEventRepository.findOne.mockResolvedValue(null);

            await expect(
                bookingService.createBooking('user-1', 'event-1', 2)
            ).rejects.toThrow('Event not found');
        });

        it('should throw error if insufficient capacity', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe',
                role: UserRole.USER,
            } as User;

            const mockEvent = {
                id: 'event-1',
                name: 'Test Event',
                availableCapacity: 1,
                basePrice: 100,
            } as Event;

            mockUserRepository.findOne.mockResolvedValue(mockUser);
            mockEventRepository.findOne.mockResolvedValue(mockEvent);

            await expect(
                bookingService.createBooking('user-1', 'event-1', 2)
            ).rejects.toThrow('Not enough capacity available');
        });
    });

    describe('getBookingDetails', () => {
        it('should return booking details', async () => {
            const mockBooking = {
                id: 'booking-1',
                status: BookingStatus.PENDING,
                totalAmount: 200,
                paymentStatus: 'PENDING',
            } as Booking;

            mockBookingRepository.findOne.mockResolvedValue(mockBooking);

            const result = await bookingService.getBookingDetails('booking-1');

            expect(result).toEqual(mockBooking);
            expect(mockBookingRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'booking-1' },
                relations: ['event', 'user', 'tickets'],
            });
        });

        it('should throw error if booking not found', async () => {
            mockBookingRepository.findOne.mockResolvedValue(null);

            await expect(
                bookingService.getBookingDetails('booking-1')
            ).rejects.toThrow('Booking not found');
        });
    });

    describe('getUserBookings', () => {
        it('should return user bookings', async () => {
            const mockBookings = [
                {
                    id: 'booking-1',
                    status: BookingStatus.PENDING,
                    totalAmount: 200,
                    paymentStatus: 'PENDING',
                },
                {
                    id: 'booking-2',
                    status: BookingStatus.CONFIRMED,
                    totalAmount: 300,
                    paymentStatus: 'PAID',
                },
            ] as Booking[];

            mockBookingRepository.find.mockResolvedValue(mockBookings);

            const result = await bookingService.getUserBookings('user-1');

            expect(result).toEqual(mockBookings);
            expect(mockBookingRepository.find).toHaveBeenCalledWith({
                where: { user: { id: 'user-1' } },
                relations: ['event', 'tickets'],
                order: { createdAt: 'DESC' },
            });
        });
    });

    describe('cancelBooking', () => {
        it('should cancel booking successfully', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe',
                role: UserRole.USER,
            } as User;

            const mockEvent = {
                id: 'event-1',
                name: 'Test Event',
                availableCapacity: 8,
                totalBookings: 2,
            } as Event;

            const mockTickets = [
                {
                    id: 'ticket-1',
                    status: TicketStatus.VALID,
                },
                {
                    id: 'ticket-2',
                    status: TicketStatus.VALID,
                },
            ] as Ticket[];

            const mockBooking = {
                id: 'booking-1',
                user: mockUser,
                event: mockEvent,
                tickets: mockTickets,
                status: BookingStatus.PENDING,
                totalAmount: 200,
                paymentStatus: 'PENDING',
            } as Booking;

            mockBookingRepository.findOne.mockResolvedValue(mockBooking);
            mockBookingRepository.save.mockResolvedValue({
                ...mockBooking,
                status: BookingStatus.CANCELLED,
                paymentStatus: 'REFUNDED',
            });
            mockEventRepository.save.mockResolvedValue({
                ...mockEvent,
                availableCapacity: 10,
                totalBookings: 0,
            });
            mockTicketRepository.save.mockResolvedValue({
                ...mockTickets[0],
                status: TicketStatus.CANCELLED,
            });

            const result = await bookingService.cancelBooking('booking-1', 'user-1');

            expect(result.status).toBe(BookingStatus.CANCELLED);
            expect(result.paymentStatus).toBe('REFUNDED');
            expect(mockEventRepository.save).toHaveBeenCalledWith({
                ...mockEvent,
                availableCapacity: 10,
                totalBookings: 0,
            });
        });

        it('should throw error if booking not found', async () => {
            mockBookingRepository.findOne.mockResolvedValue(null);

            await expect(
                bookingService.cancelBooking('booking-1', 'user-1')
            ).rejects.toThrow('Booking not found');
        });

        it('should throw error if user is not the owner', async () => {
            const mockBooking = {
                id: 'booking-1',
                user: { id: 'user-2' },
                status: BookingStatus.PENDING,
            } as Booking;

            mockBookingRepository.findOne.mockResolvedValue(mockBooking);

            await expect(
                bookingService.cancelBooking('booking-1', 'user-1')
            ).rejects.toThrow('User is not the owner of this booking');
        });

        it('should throw error if booking is already cancelled', async () => {
            const mockBooking = {
                id: 'booking-1',
                user: { id: 'user-1' },
                status: BookingStatus.CANCELLED,
            } as Booking;

            mockBookingRepository.findOne.mockResolvedValue(mockBooking);

            await expect(
                bookingService.cancelBooking('booking-1', 'user-1')
            ).rejects.toThrow('Booking is already cancelled');
        });
    });

    describe('confirmBooking', () => {
        it('should confirm booking successfully', async () => {
            const mockBooking = {
                id: 'booking-1',
                status: BookingStatus.PENDING,
                paymentStatus: 'PAID',
            } as Booking;

            mockBookingRepository.findOne.mockResolvedValue(mockBooking);
            mockBookingRepository.save.mockResolvedValue({
                ...mockBooking,
                status: BookingStatus.CONFIRMED,
            });

            const result = await bookingService.confirmBooking('booking-1');

            expect(result.status).toBe(BookingStatus.CONFIRMED);
        });

        it('should throw error if booking not found', async () => {
            mockBookingRepository.findOne.mockResolvedValue(null);

            await expect(
                bookingService.confirmBooking('booking-1')
            ).rejects.toThrow('Booking not found');
        });

        it('should throw error if booking is not in pending status', async () => {
            const mockBooking = {
                id: 'booking-1',
                status: BookingStatus.CONFIRMED,
            } as Booking;

            mockBookingRepository.findOne.mockResolvedValue(mockBooking);

            await expect(
                bookingService.confirmBooking('booking-1')
            ).rejects.toThrow('Booking is not in pending status');
        });

        it('should throw error if payment is not completed', async () => {
            const mockBooking = {
                id: 'booking-1',
                status: BookingStatus.PENDING,
                paymentStatus: 'PENDING',
            } as Booking;

            mockBookingRepository.findOne.mockResolvedValue(mockBooking);

            await expect(
                bookingService.confirmBooking('booking-1')
            ).rejects.toThrow('Payment is not completed');
        });
    });
}); 