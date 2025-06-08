import { AppDataSource } from './config/data-source';
import { User, UserRole } from './entities/User';
import { Event } from './entities/Event';
import { Booking, BookingStatus } from './entities/Booking';
import { Ticket, TicketType, TicketStatus } from './entities/Ticket';
import { Payment } from './entities/Payment';
import { EventCategory } from './entities/EventCategory';
import { Venue } from './entities/Venue';
import bcryptjs from 'bcryptjs';

async function clearData() {
  console.log('🗑️  Clearing existing data...');
  
  // Disable foreign key checks
  await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 0;');
  
  try {
    // Clear all tables using direct SQL
    await AppDataSource.query('TRUNCATE TABLE payment;');
    await AppDataSource.query('TRUNCATE TABLE ticket;');
    await AppDataSource.query('TRUNCATE TABLE booking;');
    await AppDataSource.query('TRUNCATE TABLE event;');
    await AppDataSource.query('TRUNCATE TABLE user;');
    await AppDataSource.query('TRUNCATE TABLE venue;');
    await AppDataSource.query('TRUNCATE TABLE event_category;');
    console.log('✅ Data cleared successfully');
  } finally {
    // Re-enable foreign key checks
    await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 1;');
  }
}

async function seed() {
  await AppDataSource.initialize();
  
  // Clear existing data first
  await clearData();

  // 0. 插入一个 EventCategory 和 Venue 供外键使用
  const category = new EventCategory();
  category.name = 'Music';
  await AppDataSource.getRepository(EventCategory).save(category);

  const venue = new Venue();
  venue.name = 'Main Hall';
  venue.location = 'Downtown';
  await AppDataSource.getRepository(Venue).save(venue);

  // 1. 批量插入用户
  const users: User[] = [];
  for (let i = 0; i < 30; i++) {
    const user = new User();
    user.email = `user${i}@test.com`;
    user.password = await bcryptjs.hash('password', 10); // Hash the password
    user.role = i < 3 ? UserRole.ADMIN : UserRole.USER;
    user.name = `User${i}`;
    user.isActive = true;
    users.push(user);
  }
  await AppDataSource.getRepository(User).save(users);

  // 2. 批量插入活动
  const events: Event[] = [];
  for (let i = 0; i < 10; i++) {
    const event = new Event();
    event.name = `Event ${i}`;
    event.description = `Description for event ${i}`;
    event.organizer = users[i % users.length];
    event.category = category;
    event.venue = venue;
    event.startTime = new Date(Date.now() + i * 86400000);
    event.endTime = new Date(Date.now() + (i + 1) * 86400000);
    event.isActive = true;
    event.totalCapacity = 100;
    event.availableCapacity = 100;
    event.basePrice = 50 + i * 5;
    event.hasSeatingPlan = false;
    event.isSoldOut = false;
    event.totalRevenue = 0;
    event.totalBookings = 0;
    events.push(event);
  }
  await AppDataSource.getRepository(Event).save(events);

  // 3. 批量插入订单
  const bookings: Booking[] = [];
  for (let i = 0; i < 40; i++) {
    const booking = new Booking();
    booking.user = users[i % users.length];
    booking.event = events[i % events.length];
    booking.status = BookingStatus.CONFIRMED;
    booking.totalAmount = 100 + i * 2;
    booking.paymentStatus = 'PAID';
    bookings.push(booking);
  }
  await AppDataSource.getRepository(Booking).save(bookings);

  // 4. 批量插入票
  const tickets: Ticket[] = [];
  for (let i = 0; i < 80; i++) {
    const ticket = new Ticket();
    ticket.user = users[i % users.length];
    ticket.event = events[i % events.length];
    ticket.type = i % 2 === 0 ? TicketType.REGULAR : TicketType.VIP;
    ticket.booking = bookings[i % bookings.length];
    ticket.price = 50 + (i % 10) * 5;
    ticket.status = TicketStatus.VALID;
    ticket.qrCode = `QR${i}`;
    ticket.isScanned = false;
    ticket.isRefunded = false;
    tickets.push(ticket);
  }
  await AppDataSource.getRepository(Ticket).save(tickets);

  // 5. 批量插入支付
  const payments: Payment[] = [];
  for (let i = 0; i < 30; i++) {
    const payment = new Payment();
    payment.user = users[i % users.length];
    payment.ticket = tickets[i % tickets.length];
    payment.method = 'Credit Card';
    payment.amount = tickets[i % tickets.length].price;
    payment.status = 'Success';
    payment.transactionId = `TXN${i}${Date.now()}`;
    payment.timestamp = new Date();
    await AppDataSource.getRepository(Payment).save(payment);
  }

  console.log('✅ Seeder finished!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeder error:', err);
  process.exit(1);
}); 