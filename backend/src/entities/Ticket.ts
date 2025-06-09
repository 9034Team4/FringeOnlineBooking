// src/entities/Ticket.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { Event } from './Event';
import { User } from './User';
import { Booking } from './Booking';

export enum TicketType {
  REGULAR = 'REGULAR',
  VIP = 'VIP',
  STUDENT = 'STUDENT',
  SENIOR = 'SENIOR'
}

export enum TicketStatus {
  VALID = 'VALID',
  USED = 'USED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

/**
 * A purchasable ticket for an event, optionally tied to a seat.
 */
@Entity()
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Event, event => event.tickets)
  event!: Event;

  @ManyToOne(() => User, user => user.tickets)
  user!: User;

  @ManyToOne(() => Booking, booking => booking.tickets)
  booking!: Booking;

  @Column({
    type: 'enum',
    enum: TicketType,
    default: TicketType.REGULAR
  })
  type!: TicketType;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.VALID
  })
  status!: TicketStatus;

  @Column({ nullable: true })
  row?: string;

  @Column({ nullable: true })
  seatNumber?: string;

  @Column({ nullable: true })
  section?: string;

  @Column({ nullable: true })
  ticketNumber?: string;

  @Column({ nullable: true })
  customerName?: string;

  @Column({ nullable: true })
  eventImage?: string;

  @Column({ nullable: true })
  qrCode!: string;

  @Column({ default: false })
  isScanned!: boolean;

  @Column({ nullable: true })
  scannedAt?: Date;

  @Column({ nullable: true })
  scannedBy?: string;

  @Column({ default: false })
  isRefunded!: boolean;

  @Column({ nullable: true })
  refundedAt?: Date;

  @Column({ nullable: true })
  refundReason?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

