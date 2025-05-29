import { DataSource } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { User, UserRole } from '../../entities/User';
import { Event } from '../../entities/Event';
import { Booking, BookingStatus } from '../../entities/Booking';
import { Ticket, TicketType, TicketStatus } from '../../entities/Ticket';
import { Message } from '../../entities/Message';

export const setupTestDatabase = async () => {
  const testDataSource = new DataSource({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'test',
    password: 'test',
    database: 'test_db',
    synchronize: true,
    dropSchema: true,
    entities: [User, Event, Booking, Ticket, Message],
  });

  await testDataSource.initialize();
  return testDataSource;
};

export const createTestUser = async (dataSource: DataSource, role: UserRole = UserRole.USER) => {
  const userRepo = dataSource.getRepository(User);
  const user = userRepo.create({
    email: `test${Date.now()}@example.com`,
    password: 'hashedPassword123',
    role,
    name: 'Test User',
  });
  return await userRepo.save(user);
};

export const createTestEvent = async (dataSource: DataSource, organizer: User) => {
  const eventRepo = dataSource.getRepository(Event);
  const event = eventRepo.create({
    name: 'Test Event',
    description: 'Test Description',
    startTime: new Date(Date.now() + 86400000), // Tomorrow
    endTime: new Date(Date.now() + 172800000), // Day after tomorrow
    basePrice: 100,
    totalCapacity: 100,
    availableCapacity: 100,
    organizer,
  });
  return await eventRepo.save(event);
};

export const createTestBooking = async (dataSource: DataSource, user: User, event: Event) => {
  const bookingRepo = dataSource.getRepository(Booking);
  const booking = bookingRepo.create({
    user,
    event,
    totalAmount: 100,
    status: BookingStatus.CONFIRMED,
    paymentStatus: 'PAID',
  });
  return await bookingRepo.save(booking);
};

export const createTestTicket = async (dataSource: DataSource, user: User, event: Event, booking: Booking) => {
  const ticketRepo = dataSource.getRepository(Ticket);
  const ticket = ticketRepo.create({
    user,
    event,
    booking,
    price: 100,
    type: TicketType.REGULAR,
    status: TicketStatus.VALID,
  });
  return await ticketRepo.save(ticket);
};

export const createTestMessage = async (dataSource: DataSource, sender: User, receiver: User) => {
  const messageRepo = dataSource.getRepository(Message);
  const message = messageRepo.create({
    sender,
    receiver,
    content: 'Test message content',
  });
  return await messageRepo.save(message);
};

export const cleanupTestDatabase = async (dataSource: DataSource) => {
  await dataSource.destroy();
}; 