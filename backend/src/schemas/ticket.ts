import { z } from 'zod';
import { TicketType } from '../entities/Ticket';

export const ticketCreateSchema = z.object({
  eventId: z.string().uuid(),
  ticketType: z.nativeEnum(TicketType),
  quantity: z.number().int().positive(),
  seatIds: z.array(z.string().uuid()).optional()
});

export const ticketQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(50).optional().default(10),
  status: z.enum(['VALID', 'USED', 'CANCELLED', 'REFUNDED']).optional(),
  eventId: z.string().uuid().optional(),
  userId: z.string().uuid().optional()
});

export const ticketRefundSchema = z.object({
  reason: z.string().min(10).max(500),
  amount: z.number().positive().optional()
}); 