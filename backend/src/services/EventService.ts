import { AppDataSource } from '../config/data-source';
import { Event, EventStatus } from '../entities/Event';
import { User, UserRole } from '../entities/User';
import { Repository } from 'typeorm';

interface CreateEventData {
    name: string;
    description: string;
    startTime: Date;
    endTime: Date;
    venue: string;
    category: string;
    capacity: number;
    basePrice: number;
}

interface UpdateEventData {
    name?: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
    venue?: string;
    category?: string;
    capacity?: number;
    basePrice?: number;
    status?: EventStatus;
}

export class EventService {
    private eventRepository: Repository<Event>;
    private userRepository: Repository<User>;

    constructor() {
        this.eventRepository = AppDataSource.getRepository(Event);
        this.userRepository = AppDataSource.getRepository(User);
    }

    async createEvent(organizerId: string, eventData: CreateEventData): Promise<Event> {
        const organizer = await this.userRepository.findOne({ where: { id: organizerId } });
        if (!organizer) {
            throw new Error('Organizer not found');
        }

        if (organizer.role !== UserRole.ORGANIZER) {
            throw new Error('User is not an organizer');
        }

        if (eventData.endTime <= eventData.startTime) {
            throw new Error('End time must be after start time');
        }

        const event = new Event();
        Object.assign(event, {
            ...eventData,
            organizer,
            status: EventStatus.DRAFT,
            availableCapacity: eventData.capacity,
            totalBookings: 0
        });

        return this.eventRepository.save(event);
    }

    async updateEvent(eventId: string, userId: string, eventData: UpdateEventData): Promise<Event> {
        const event = await this.eventRepository.findOne({
            where: { id: eventId },
            relations: ['organizer']
        });

        if (!event) {
            throw new Error('Event not found');
        }

        if (event.organizer.id !== userId) {
            throw new Error('User is not the organizer of this event');
        }

        if (eventData.capacity && eventData.capacity < event.totalBookings) {
            throw new Error('New capacity cannot be less than current bookings');
        }

        if (eventData.endTime && eventData.startTime && eventData.endTime <= eventData.startTime) {
            throw new Error('End time must be after start time');
        }

        Object.assign(event, eventData);
        return this.eventRepository.save(event);
    }

    async getEventDetails(eventId: string): Promise<Event> {
        const event = await this.eventRepository.findOne({
            where: { id: eventId },
            relations: ['organizer']
        });

        if (!event) {
            throw new Error('Event not found');
        }

        return event;
    }

    async listEvents(filters: {
        status?: EventStatus;
        organizerId?: string;
        page?: number;
        limit?: number;
    } = {}): Promise<Event[]> {
        const { status, organizerId, page = 1, limit = 10 } = filters;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.status = status;
        if (organizerId) where.organizer = { id: organizerId };

        return this.eventRepository.find({
            where,
            relations: ['organizer'],
            skip,
            take: limit,
            order: { startTime: 'ASC' }
        });
    }

    async deleteEvent(eventId: string, userId: string): Promise<void> {
        const event = await this.eventRepository.findOne({
            where: { id: eventId },
            relations: ['organizer']
        });

        if (!event) {
            throw new Error('Event not found');
        }

        if (event.organizer.id !== userId) {
            throw new Error('User is not the organizer of this event');
        }

        if (event.totalBookings > 0) {
            throw new Error('Cannot delete event with existing bookings');
        }

        await this.eventRepository.delete(eventId);
    }
}
