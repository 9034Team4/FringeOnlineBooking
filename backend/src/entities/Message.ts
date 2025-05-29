import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './User';

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, user => user.sentMessages)
  sender!: User;

  @ManyToOne(() => User, user => user.receivedMessages)
  receiver!: User;

  @Column()
  content!: string;

  @CreateDateColumn()
  createdAt!: Date;
} 