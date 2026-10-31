import { z } from 'zod';

export const createStopSchema = z.object({
  name: z.string().min(1, 'Stop name is required').max(100),
  shortName: z.string().max(30).optional(),
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  address: z.string().max(250).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['active', 'inactive', 'temporary']).default('active'),
  facilities: z.array(z.string()).optional(),
});

export const updateStopSchema = createStopSchema.partial();

export type CreateStopInput = z.infer<typeof createStopSchema>;
export type UpdateStopInput = z.infer<typeof updateStopSchema>;
