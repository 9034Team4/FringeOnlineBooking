import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { EventCategory } from "./EventCategory";
import { Ticket } from "./Ticket";
import { Venue } from "./Venue";
import { User } from './User';
import { Booking } from './Booking';

/**
 * Represents a single performance or show in the festival.
 */
export enum EventStatus {
    DRAFT = 'DRAFT',
    UPCOMING = 'UPCOMING',
    ONGOING = 'ONGOING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

@Entity()
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id!: string; // Auto-increment primary key

  @Column()
  name!: string; // Name of the event

  @Column('text')
  description!: string; // Full description of the event

  @Column({ nullable: true })
  imageUrl!: string; // Cover image URL for the event

  @Column()
  startTime!: Date; // Start datetime

  @Column()
  endTime!: Date; // End datetime

  @ManyToOne(() => Venue, (venue) => venue.events)
  venue!: Venue; // Venue where the event happens

  @ManyToOne(() => EventCategory, (category) => category.events)
  category!: EventCategory; // Category for filtering

  @Column({ default: true })
  isActive!: boolean; // Indicates if the event is currently available

  @Column({ default: 0 })
  totalCapacity!: number;

  @Column({ default: 0 })
  availableCapacity!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  basePrice!: number;

  @Column({ default: false })
  hasSeatingPlan!: boolean;

  @Column('json', { nullable: true })
  seatingPlan!: {
    rows: number;
    columns: number;
    sections: Array<{
      name: string;
      rows: Array<{
        rowNumber: number;
        seats: Array<{
          seatNumber: string;
          type: string;
          price: number;
          isAvailable: boolean;
        }>;
      }>;
    }>;
  };

  @OneToMany(() => Ticket, (ticket) => ticket.event)
  tickets!: Ticket[]; // All tickets associated with this event

  @Column({ default: false })
  isSoldOut!: boolean;

  @Column({ default: 0 })
  totalRevenue!: number;

  @Column({ default: 0 })
  totalBookings!: number;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.DRAFT
  })
  status!: EventStatus;

  @ManyToOne(() => User, user => user.events)
  organizer!: User;

  @OneToMany(() => Booking, booking => booking.event)
  bookings!: Booking[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
