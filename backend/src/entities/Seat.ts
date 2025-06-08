// src/entities/Seat.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Venue } from './Venue';
import { Event } from './Event';

/**
 * Seat status enumeration
 */
export enum SeatStatus {
  AVAILABLE = 'available',   // Available for booking
  LOCKED = 'locked',         // Temporarily locked
  BOOKED = 'booked',         // Booked and confirmed
  UNAVAILABLE = 'unavailable' // Not available
}

/**
 * A specific seat inside a venue, used for assigned seating.
 */
@Entity()
export class Seat {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  seatNumber!: string; // Seat identifier (e.g., A5)

  @Column()
  row!: string; // Row label (e.g., A, B)

  @Column({ nullable: true })
  section!: string; // Section (e.g., Orchestra, Balcony)

  @Column()
  isAccessible!: boolean; // Whether the seat is wheelchair accessible

  @Column({ 
    type: 'enum', 
    enum: SeatStatus, 
    default: SeatStatus.AVAILABLE 
  })
  status!: SeatStatus; // Current seat status

  @Column({ nullable: true })
  lockTime!: Date; // When the seat was locked

  @Column({ nullable: true })
  lockBy!: string; // User ID who locked the seat

  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 2, 
    default: 0 
  })
  price!: number; // Seat price

  @Column({ default: 'standard' })
  type!: string; // Seat type (standard, vip, wheelchair)

  @ManyToOne(() => Venue, (venue) => venue.seats)
  venue!: Venue; // The venue the seat belongs to

  @ManyToOne(() => Event, { nullable: true })
  event!: Event; // The event this seat is associated with

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

