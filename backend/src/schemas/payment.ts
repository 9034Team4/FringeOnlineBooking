import { z } from 'zod';

export const paymentProcessSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number().positive(),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL']),
  currency: z.enum(['AUD', 'USD']).default('AUD'),
  metadata: z.record(z.string()).optional()
});

export const paymentRefundSchema = z.object({
  reason: z.string().min(10).max(500),
  amount: z.number().positive().optional(), // Optional for partial refunds
  metadata: z.record(z.string()).optional()
}); 