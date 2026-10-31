import { z } from 'zod';

export const stopSequenceEntrySchema = z.object({
  stopId: z.string().min(1, 'Stop ID is required'),
  sequence: z.number().int().positive('Sequence must be a positive integer'),
  scheduledOffset: z.number().nonnegative('Scheduled offset must be >= 0 minutes').optional(),
  isPickup: z.boolean().default(true),
  isDropoff: z.boolean().default(true),
});

export const createRouteSchema = z.object({
  routeCode: z.string().min(1, 'Route code is required').max(15),
  routeName: z.string().min(1, 'Route name is required').max(100),
  direction: z.enum(['inbound', 'outbound', 'circular']),
  originStopId: z.string().min(1, 'Origin stop ID is required'),
  destinationStopId: z.string().min(1, 'Destination stop ID is required'),
  stopSequence: z.array(stopSequenceEntrySchema).min(2, 'Route must have at least 2 stops'),
  operatingDays: z.array(z.string()).min(1, 'At least one operating day must be specified'),
  firstDeparture: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be HH:MM format').optional(),
  lastDeparture: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be HH:MM format').optional(),
  estimatedDuration: z.number().int().positive('Estimated duration must be positive minutes').optional(),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  color: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Color must be a valid hex code').optional(),
  description: z.string().max(500).optional(),
});

export const updateRouteSchema = createRouteSchema.partial();

export type StopSequenceEntryInput = z.infer<typeof stopSequenceEntrySchema>;
export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
