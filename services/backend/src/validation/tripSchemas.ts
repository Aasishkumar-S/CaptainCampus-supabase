import { z } from 'zod';

export const createTripSchema = z.object({
  busId: z.string().min(1),
  driverId: z.string().min(1),
  routeId: z.string().min(1),
  scheduledStart: z.string().datetime({ offset: true }),
  scheduledEnd: z.string().datetime({ offset: true }).optional(),
  notes: z.string().max(500).optional(),
});

export const updateTripSchema = createTripSchema.partial();

export const delayTripSchema = z.object({
  delayMinutes: z.number().int().positive(),
  reason: z.string().max(200).optional(),
});

export const cancelTripSchema = z.object({
  reason: z.string().max(200).optional(),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type DelayTripInput = z.infer<typeof delayTripSchema>;
export type CancelTripInput = z.infer<typeof cancelTripSchema>;
