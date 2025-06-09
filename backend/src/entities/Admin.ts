// src/entities/Admin.ts

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Represents an admin user with elevated privileges. 
 */
@Entity()
export class Admin {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string; // Unique email used to login

  @Column()
  passwordHash!: string; // Hashed password

  @Column()
  fullName!: string;

  @Column()
  role!: string; // Admin role (e.g., Super Admin)

  @Column()
  lastLogin!: Date;

  @Column()
  isActive!: boolean; // Whether the admin account is active
}

