import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Event } from './Event';
import { User } from './User';
import { Ticket } from './Ticket';

export enum BookingStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    REFUNDED = 'REFUNDED'
}

@Entity()
export class Booking {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => Event, event => event.bookings)
    event!: Event;

    @ManyToOne(() => User, user => user.bookings)
    user!: User;

    @OneToMany(() => Ticket, ticket => ticket.booking)
    tickets!: Ticket[];

    @Column({
        type: 'enum',
        enum: BookingStatus,
        default: BookingStatus.PENDING
    })
    status!: BookingStatus;

    @Column('decimal', { precision: 10, scale: 2 })
    totalAmount!: number;

    @Column({
        type: 'enum',
        enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
        default: 'PENDING'
    })
    paymentStatus!: string;

    @Column({ nullable: true })
    paymentId!: string;

    @Column({ nullable: true })
    refundReason!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
} 