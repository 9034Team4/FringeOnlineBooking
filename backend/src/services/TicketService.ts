import { Repository } from 'typeorm';
import { Ticket, TicketType, TicketStatus } from '../entities/Ticket';
import { Event } from '../entities/Event';
import { User } from '../entities/User';
import { AppDataSource } from '../config/data-source';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';

export class TicketService {
    private ticketRepository: Repository<Ticket>;
    private eventRepository: Repository<Event>;
    private userRepository: Repository<User>;

    constructor() {
        this.ticketRepository = AppDataSource.getRepository(Ticket);
        this.eventRepository = AppDataSource.getRepository(Event);
        this.userRepository = AppDataSource.getRepository(User);
    }

    async createTicket(eventId: string, userId: string, ticketType: TicketType, seatNumber?: string, section?: string): Promise<Ticket> {
        const event = await this.eventRepository.findOne({ where: { id: eventId } });
        if (!event) {
            throw new Error('Event not found');
        }

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }

        // Check if event has available capacity
        if (event.availableCapacity <= 0) {
            throw new Error('Event is sold out');
        }

        // Generate unique ticket ID
        const ticketId = uuidv4();

        // Generate QR code
        const qrCodeData = JSON.stringify({
            ticketId,
            eventId,
            userId,
            timestamp: new Date().toISOString()
        });

        const qrCode = await QRCode.toDataURL(qrCodeData);

        // Create ticket
        const ticket = this.ticketRepository.create({
            event,
            user,
            type: ticketType,
            price: event.basePrice, // This should be adjusted based on ticket type
            seatNumber,
            section,
            qrCode,
            status: TicketStatus.VALID
        });

        // Update event capacity
        event.availableCapacity -= 1;
        event.totalBookings += 1;
        if (event.availableCapacity === 0) {
            event.isSoldOut = true;
        }

        await this.eventRepository.save(event);
        return await this.ticketRepository.save(ticket);
    }

    async validateTicket(ticketId: string, scannerId: string): Promise<boolean> {
        const ticket = await this.ticketRepository.findOne({ where: { id: ticketId } });
        if (!ticket) {
            throw new Error('Ticket not found');
        }

        if (ticket.isScanned) {
            throw new Error('Ticket already scanned');
        }

        if (ticket.status !== TicketStatus.VALID) {
            throw new Error('Ticket not valid');
        }

        // Update ticket status
        ticket.isScanned = true;
        ticket.scannedAt = new Date();
        ticket.scannedBy = scannerId;
        ticket.status = TicketStatus.USED;
        await this.ticketRepository.save(ticket);

        return true;
    }

    async getTicketDetails(ticketId: string): Promise<Ticket> {
        const ticket = await this.ticketRepository.findOne({
            where: { id: ticketId },
            relations: ['event', 'user']
        });

        if (!ticket) {
            throw new Error('Ticket not found');
        }

        return ticket;
    }

    async getUserTickets(userId: string): Promise<Ticket[]> {
        return await this.ticketRepository.find({
            where: { user: { id: userId } },
            relations: ['event'],
            order: { createdAt: 'DESC' }
        });
    }

    async cancelTicket(ticketId: string, reason: string): Promise<Ticket> {
        const ticket = await this.ticketRepository.findOne({
            where: { id: ticketId },
            relations: ['event']
        });

        if (!ticket) {
            throw new Error('Ticket not found');
        }

        if (ticket.isScanned) {
            throw new Error('Cannot cancel a scanned ticket');
        }

        ticket.status = TicketStatus.CANCELLED;
        ticket.isRefunded = true;
        ticket.refundedAt = new Date();
        ticket.refundReason = reason;

        // Update event capacity
        const event = ticket.event;
        event.availableCapacity += 1;
        event.totalBookings -= 1;
        event.isSoldOut = false;

        await this.eventRepository.save(event);
        return await this.ticketRepository.save(ticket);
    }
} 