import { z } from 'zod';

export const updateSettingsSchema = z.object({
  taxRate: z
    .number({ invalid_type_error: 'Tax rate must be a number' })
    .min(0, 'Tax rate cannot be negative')
    .max(100, 'Tax rate cannot exceed 100 percent'),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
