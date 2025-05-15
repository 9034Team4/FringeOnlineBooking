import { z } from 'zod';

export const bookingCreateSchema = z.object({
  eventId: z.string().uuid(),
  seatIds: z.array(z.string().uuid()),
  ticketType: z.enum(['REGULAR', 'VIP', 'STUDENT', 'SENIOR']),
  quantity: z.number().int().positive().max(10)
});

export const bookingCancelSchema = z.object({
  reason: z.string().min(10).max(500)
});

export const bookingQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(50).optional().default(10),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
}); 