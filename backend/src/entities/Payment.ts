// src/entities/Payment.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { User } from './User';
import { Ticket } from './Ticket';

/**
 * Records payments made by users for tickets.
 */
@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User)
  user!: User; // The paying user

  @OneToOne(() => Ticket)
  @JoinColumn()
  ticket!: Ticket; // Ticket being paid for

  @Column()
  method!: string; // E.g., Credit Card, PayPal

  @Column('decimal')
  amount!: number;

  @Column()
  status!: string; // E.g., Success, Failed

  @Column()
  transactionId!: string;

  @Column()
  timestamp!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
