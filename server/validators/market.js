import { z } from 'zod';

const marketCurrency = z.enum(['zen', 'wcoinc', 'jewels']);
const positiveAmount = z.number().finite().positive().max(2_000_000_000);

export const listingQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  category: z.string().trim().max(32).optional(),
  class: z.string().trim().max(32).optional(),
  currency: marketCurrency.optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).optional(),
  page: z.coerce.number().int().min(1).max(500).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
});

export const publishListingSchema = z.object({
  gameItemId: z.string().trim().min(1).max(128),
  character: z.string().trim().min(1).max(10),
  price: positiveAmount,
  currency: marketCurrency,
});

export const offerSchema = z.object({
  amount: positiveAmount,
  currency: marketCurrency,
  message: z.string().trim().max(240).optional().default(''),
});

export const offerDecisionSchema = z.object({ decision: z.enum(['accept', 'decline']) });

export const withdrawalSchema = z.object({
  amount: positiveAmount,
  currency: marketCurrency,
  character: z.string().trim().min(1).max(10),
});
