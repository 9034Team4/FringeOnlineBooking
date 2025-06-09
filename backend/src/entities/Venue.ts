// src/entities/Venue.ts

import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Event } from './Event';
import { Seat } from './Seat';

/**
 * Venue seating layout type definition
 */
export interface SeatingLayout {
  rows: number;
  columns: number;
  rowLabels: string[];
  sectionLayout: {
    [section: string]: {
      startRow: number;
      endRow: number;
      startCol: number;
      endCol: number;
    }
  }
}

/**
 * A physical location where events take place.
 */
@Entity()
export class Venue {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string; // Venue name

  @Column()
  location!: string; // Physical or geographic location

  @Column({ nullable: true })
  address!: string; // Street address

  @Column({ nullable: true })
  city!: string; // City name

  @Column({ nullable: true })
  gate!: string; // Main entrance gate

  @Column({ nullable: true })
  imageUrl!: string; // Venue image URL

  @Column({ type: 'int', default: 0 })
  capacity!: number; // Total venue capacity

  @Column({ type: 'json', nullable: true })
  seatingLayout!: SeatingLayout | null; // Seating layout configuration

  @Column({ type: 'boolean', default: false })
  hasAssignedSeating!: boolean; // Whether venue uses assigned seating

  @OneToMany(() => Event, (event) => event.venue)
  events!: Event[]; // Events scheduled at this venue

  @OneToMany(() => Seat, (seat) => seat.venue)
  seats!: Seat[]; // All seats in this venue
}
