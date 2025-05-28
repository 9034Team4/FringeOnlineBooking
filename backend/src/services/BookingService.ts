import { AppDataSource } from '../config/data-source';
import { Booking, BookingStatus } from '../entities/Booking';
import { Event } from '../entities/Event';
import { User } from '../entities/User';
import { Ticket, TicketStatus } from '../entities/Ticket';
import { Repository } from 'typeorm';

export class BookingService {
    private bookingRepository: Repository<Booking>;
    private eventRepository: Repository<Event>;
    private userRepository: Repository<User>;
    private ticketRepository: Repository<Ticket>;

    constructor() {
        this.bookingRepository = AppDataSource.getRepository(Booking);
        this.eventRepository = AppDataSource.getRepository(Event);
        this.userRepository = AppDataSource.getRepository(User);
        this.ticketRepository = AppDataSource.getRepository(Ticket);
    }

    async createBooking(userId: string, eventId: string, quantity: number): Promise<Booking> {
        const event = await this.eventRepository.findOne({ where: { id: eventId } });
        if (!event) {
            throw new Error('Event not found');
        }

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }

        if (event.availableCapacity < quantity) {
            throw new Error('Not enough capacity available');
        }

        const booking = this.bookingRepository.create({
            event,
            user,
            status: BookingStatus.PENDING,
            totalAmount: event.basePrice * quantity,
            paymentStatus: 'PENDING'
        });

        const savedBooking = await this.bookingRepository.save(booking);

        // Create tickets
        const tickets = Array(quantity).fill(null).map(() => 
            this.ticketRepository.create({
                event,
                user,
                booking: savedBooking,
                type: 'REGULAR',
                price: event.basePrice,
                status: TicketStatus.VALID
            } as Ticket)
        );

        await this.ticketRepository.save(tickets);

        // Update event capacity
        event.availableCapacity -= quantity;
        event.totalBookings += quantity;
        await this.eventRepository.save(event);

        return savedBooking;
    }

    async getBookingDetails(bookingId: string): Promise<Booking> {
        const booking = await this.bookingRepository.findOne({
            where: { id: bookingId },
            relations: ['event', 'user', 'tickets']
        });

        if (!booking) {
            throw new Error('Booking not found');
        }

        return booking;
    }

    async getUserBookings(userId: string): Promise<Booking[]> {
        return this.bookingRepository.find({
            where: { user: { id: userId } },
            relations: ['event', 'tickets'],
            order: { createdAt: 'DESC' }
        });
    }

    async cancelBooking(bookingId: string, userId: string): Promise<Booking> {
        const booking = await this.bookingRepository.findOne({
            where: { id: bookingId },
            relations: ['event', 'user', 'tickets']
        });

        if (!booking) {
            throw new Error('Booking not found');
        }

        if (booking.user.id !== userId) {
            throw new Error('User is not the owner of this booking');
        }

        if (booking.status === BookingStatus.CANCELLED) {
            throw new Error('Booking is already cancelled');
        }

        booking.status = BookingStatus.CANCELLED;
        booking.paymentStatus = 'REFUNDED';

        // Update event capacity
        const event = booking.event;
        event.availableCapacity += booking.tickets.length;
        event.totalBookings -= booking.tickets.length;
        await this.eventRepository.save(event);

        // Update tickets status
        booking.tickets.forEach(ticket => {
            ticket.status = TicketStatus.CANCELLED;
        });
        await this.ticketRepository.save(booking.tickets);

        return this.bookingRepository.save(booking);
    }

    async confirmBooking(bookingId: string): Promise<Booking> {
        const booking = await this.bookingRepository.findOne({
            where: { id: bookingId }
        });

        if (!booking) {
            throw new Error('Booking not found');
        }

        if (booking.status !== BookingStatus.PENDING) {
            throw new Error('Booking is not in pending status');
        }

        if (booking.paymentStatus !== 'PAID') {
            throw new Error('Payment is not completed');
        }

        booking.status = BookingStatus.CONFIRMED;
        return this.bookingRepository.save(booking);
    }
}
