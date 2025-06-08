import { DataSource } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { User, UserRole } from '../../entities/User';
import { Event } from '../../entities/Event';
import { Booking, BookingStatus } from '../../entities/Booking';
import { Ticket, TicketType, TicketStatus } from '../../entities/Ticket';
import { Message } from '../../entities/Message';
import { Venue } from '../../entities/Venue';
import { Seat, SeatStatus } from '../../entities/Seat';
import { Payment } from '../../entities/Payment';

// 支付方式枚举
export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH = 'CASH',
  WECHAT = 'WECHAT',
  ALIPAY = 'ALIPAY'
}

// 支付状态枚举
export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED'
}

export const setupTestDatabase = async () => {
  // 返回模拟的 DataSource 对象，而不是真正连接数据库
  const mockDataSource = {
    getRepository: jest.fn().mockImplementation(() => ({
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue({}),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 1, ...entity })),
      create: jest.fn().mockImplementation((data) => ({ id: 1, ...data })),
      delete: jest.fn().mockResolvedValue(true),
      update: jest.fn().mockResolvedValue(true),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({}),
        getMany: jest.fn().mockResolvedValue([]),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
      })
    })),
    initialize: jest.fn().mockResolvedValue(true),
    destroy: jest.fn().mockResolvedValue(true),
    manager: {
      transaction: jest.fn().mockImplementation((fn) => fn({}))
    }
  } as unknown as DataSource;

  return mockDataSource;
};

export const createTestUser = async (dataSource: DataSource, role: UserRole = UserRole.USER) => {
  const user = {
    id: 1,
    email: `test${Date.now()}@example.com`,
    password: 'hashedPassword123',
    role,
    name: 'Test User',
    isVerified: true,
    isActive: true,
    tickets: [],
    bookings: [],
    createdAt: new Date(),
    updatedAt: new Date()
  } as unknown as User;
  return user;
};

export const createTestVenue = async (dataSource: DataSource) => {
  const venue = {
    id: 1,
    name: 'Test Venue',
    location: 'Test Location',
    events: [],
    seats: []
  } as unknown as Venue;
  return venue;
};

export const createTestEvent = async (dataSource: DataSource, organizer: User, venue?: Venue) => {
  let testVenue = venue;
  
  if (!testVenue) {
    testVenue = await createTestVenue(dataSource);
  }
  
  const event = {
    id: 1,
    name: 'Test Event',
    description: 'Test Description',
    startTime: new Date(Date.now() + 86400000), // Tomorrow
    endTime: new Date(Date.now() + 172800000), // Day after tomorrow
    basePrice: 100,
    totalCapacity: 100,
    availableCapacity: 100,
    organizer,
    venue: testVenue,
    category: 'Test Category',
    isActive: true,
    hasSeatingPlan: true,
    seatingPlan: 'Test Seating Plan',
    createdAt: new Date(),
    updatedAt: new Date()
  } as unknown as Event;
  return event;
};

export const createTestSeat = async (dataSource: DataSource, event: Event, venue: Venue, status: SeatStatus = SeatStatus.AVAILABLE) => {
  const seat = {
    id: 1,
    row: 'A',
    seatNumber: `${Math.floor(Math.random() * 100) + 1}`,
    section: 'Main',
    price: 50,
    status: status,
    event,
    venue,
  } as unknown as Seat;
  return seat;
};

export const createMultipleTestSeats = async (dataSource: DataSource, event: Event, venue: Venue, count: number, status: SeatStatus = SeatStatus.AVAILABLE) => {
  const seats = [];
  for (let i = 0; i < count; i++) {
    const seat = await createTestSeat(dataSource, event, venue, status);
    seat.id = i + 1;
    seats.push(seat);
  }
  return seats;
};

export const createTestBooking = async (dataSource: DataSource, user: User, event: Event) => {
  const booking = {
    id: 1,
    user,
    event,
    totalAmount: 100,
    status: BookingStatus.CONFIRMED,
    paymentStatus: 'PAID',
    tickets: [],
    paymentId: 'payment-1',
    refundReason: '',
    createdAt: new Date(),
    updatedAt: new Date()
  } as unknown as Booking;
  return booking;
};

export const createTestTicket = async (dataSource: DataSource, user: User, event: Event, booking: Booking) => {
  const ticket = {
    id: 1,
    user,
    event,
    booking,
    price: 100,
    type: TicketType.REGULAR,
    status: TicketStatus.VALID,
    qrCode: 'test-qr-code',
    isScanned: false,
    isRefunded: false,
    createdAt: new Date(),
    updatedAt: new Date()
  } as unknown as Ticket;
  return ticket;
};

export const createTestPayment = async (dataSource: DataSource, booking: Booking) => {
  const ticket = await createTestTicket(dataSource, booking.user, booking.event, booking);
  
  const payment = {
    id: 1,
    user: booking.user,
    ticket: ticket,
    method: PaymentMethod.CREDIT_CARD,
    amount: booking.totalAmount,
    status: PaymentStatus.COMPLETED,
    transactionId: `txn_${Date.now()}`,
    timestamp: new Date(),
  } as unknown as Payment;
  
  return payment;
};

export const createTestMessage = async (dataSource: DataSource, sender: User, receiver: User) => {
  const message = {
    id: 1,
    sender,
    receiver,
    content: 'Test message content',
    createdAt: new Date()
  } as unknown as Message;
  return message;
};

export const cleanupTestDatabase = async (dataSource: DataSource) => {
  // 不需要实际清理
  return;
}; 