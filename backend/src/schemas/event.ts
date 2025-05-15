import { z } from 'zod';

export const eventQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(50).optional().default(10),
  category: z.string().optional(),
  venue: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['date', 'price', 'popularity']).optional().default('date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
}); 