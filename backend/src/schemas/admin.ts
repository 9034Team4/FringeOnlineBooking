import { z } from 'zod';

// Admin Auth Schemas
export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Event Schemas
export const eventCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  venueId: z.string(),
  price: z.number().min(0),
  capacity: z.number().int().positive(),
  category: z.string(),
  status: z.enum(['draft', 'published', 'cancelled']),
  imageUrl: z.string().nullable().optional(),
});

export const eventUpdateSchema = eventCreateSchema.partial();

// Venue Schemas
export const venueCreateSchema = z.object({
  name: z.string().min(1),
  address: z.string(),
  capacity: z.number().int().positive(),
  description: z.string(),
  facilities: z.array(z.string()),
});

export const venueUpdateSchema = venueCreateSchema.partial();

// Seat Schemas
export const seatCreateSchema = z.object({
  venueId: z.string().uuid(),
  section: z.string(),
  row: z.string(),
  number: z.string(),
  type: z.enum(['standard', 'vip', 'wheelchair']),
  price: z.number().positive(),
  eventId: z.string().uuid().optional(),
});

export const getAvailableSeatsSchema = z.object({
  eventId: z.string().uuid(),
});

export const lockSeatsSchema = z.object({
  eventId: z.string().uuid(),
  seatIds: z.array(z.number()),
});

export const confirmBookingSchema = z.object({
  eventId: z.string().uuid(),
  seatIds: z.array(z.number()),
});

// Ticket Admin Schemas
export const ticketQuerySchema = z.object({
  eventId: z.string().uuid(),
  status: z.enum(['active', 'cancelled', 'used']).optional(),
});

// Admin Settings Schemas
export const settingUpdateSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean()]),
}); 