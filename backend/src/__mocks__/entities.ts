// 为测试提供简单的实体模拟
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  ORGANIZER = 'ORGANIZER',
  STAFF = 'STAFF'
}

export class User {
  id!: string;
  email!: string;
  password!: string;
  firstName!: string;
  lastName!: string;
  role!: UserRole;
  isVerified!: boolean;
  isActive!: boolean;
  tickets!: Ticket[];
  bookings!: Booking[];
  events!: Event[];
  createdAt!: Date;
  updatedAt!: Date;
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  UPCOMING = 'UPCOMING',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export class Event {
  id!: string;
  name!: string;
  description!: string;
  startTime!: Date;
  endTime!: Date;
  venue!: Venue;
  category!: EventCategory;
  isActive!: boolean;
  totalCapacity!: number;
  availableCapacity!: number;
  basePrice!: number;
  hasSeatingPlan!: boolean;
  seatingPlan!: any;
  tickets!: Ticket[];
  isSoldOut!: boolean;
  totalRevenue!: number;
  totalBookings!: number;
  status!: EventStatus;
  organizer!: User;
  bookings!: Booking[];
  createdAt!: Date;
  updatedAt!: Date;
}

export class EventCategory {
  id!: number;
  name!: string;
  events!: Event[];
}

export class Venue {
  id!: number;
  name!: string;
  location!: string;
  events!: Event[];
  seats!: Seat[];
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export class Booking {
  id!: string;
  user!: User;
  event!: Event;
  totalAmount!: number;
  status!: BookingStatus;
  paymentStatus!: string;
  tickets!: Ticket[];
  paymentId!: string;
  refundReason!: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export enum TicketType {
  REGULAR = 'REGULAR',
  VIP = 'VIP',
  EARLY_BIRD = 'EARLY_BIRD',
  GROUP = 'GROUP'
}

export enum TicketStatus {
  VALID = 'VALID',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export class Ticket {
  id!: string;
  user!: User;
  event!: Event;
  booking!: Booking;
  price!: number;
  type!: TicketType;
  status!: TicketStatus;
  qrCode!: string;
  isScanned!: boolean;
  isRefunded!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export enum SeatStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  SOLD = 'SOLD',
  BLOCKED = 'BLOCKED'
}

export class Seat {
  id!: number;
  row!: string;
  seatNumber!: string;
  section!: string;
  price!: number;
  status!: SeatStatus;
  event!: Event;
  venue!: Venue;
}

export class Message {
  id!: number;
  sender!: User;
  receiver!: User;
  content!: string;
  createdAt!: Date;
}

export class Payment {
  id!: number;
  user!: User;
  ticket!: Ticket;
  method!: string;
  amount!: number;
  status!: string;
  transactionId!: string;
  timestamp!: Date;
} 