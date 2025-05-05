import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Ticket } from './Ticket';
import { Booking } from './Booking';
import { Event } from './Event';

/**
 * User entity representing public users of the booking system.
 */
export enum UserRole {
  USER = 'USER',
  ORGANIZER = 'ORGANIZER',
  ADMIN = 'ADMIN'
}

@Entity()
export class User {
  /** Auto-incremented user ID */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Unique user email used for login */
  @Column({ unique: true })
  email!: string;

  /** Hashed password */
  @Column()
  password!: string;

  /** User role: 'user' or 'admin' */
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  role!: UserRole;

  /** User display name */
  @Column({ nullable: true })
  name?: string;

  /** Profile picture (avatar) URL */
  @Column({ nullable: true })
  avatar?: string;

  /** First name of the user */
  @Column()
  firstName!: string;

  /** Last name of the user */
  @Column()
  lastName!: string;

  /** Indicates if the user's email is verified */
  @Column({ default: false })
  isVerified!: boolean;

  /** Verification token for email verification */
  @Column({ nullable: true })
  verificationToken?: string;

  /** Reset password token for password reset */
  @Column({ nullable: true })
  resetPasswordToken?: string;

  /** Expiration date for password reset */
  @Column({ nullable: true })
  resetPasswordExpires?: Date;

  /** Tickets associated with the user */
  @OneToMany(() => Ticket, ticket => ticket.user)
  tickets!: Ticket[];

  /** Indicates if the user is active */
  @Column({ default: true })
  isActive!: boolean;

  /** Bookings associated with the user */
  @OneToMany(() => Booking, booking => booking.user)
  bookings!: Booking[];

  /** Events organized by the user */
  @OneToMany(() => Event, event => event.organizer)
  events!: Event[];

  /** Timestamp of registration */
  @CreateDateColumn()
  createdAt!: Date;

  /** Timestamp of last update */
  @UpdateDateColumn()
  updatedAt!: Date;
}
