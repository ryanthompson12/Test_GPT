/**
 * Zod schemas shared by the forms (validation) and, where useful, repository
 * input checking. The market form keeps every field as a string (that's what
 * TextInput gives us); numeric/null conversion happens at submit time.
 */
import { z } from 'zod';

const minutes = z.string().regex(/^\d*$/, 'Numbers only');

export const marketFormSchema = z.object({
  name: z.string().trim().min(1, 'Please name this market'),
  marketTypeId: z.string().nullable(),
  location: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD'),
  setupMinutes: minutes,
  sellingMinutes: minutes,
  teardownMinutes: minutes,
  status: z.enum(['planned', 'completed', 'cancelled']),
  notes: z.string(),
});

export type MarketFormValues = z.infer<typeof marketFormSchema>;

export const moneyFieldSchema = z
  .string()
  .min(1, 'Enter an amount')
  .regex(/^\$?\d[\d,]*(\.\d{1,2})?$/, 'Enter a valid amount');
