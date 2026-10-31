import { z } from 'zod';

// Indian and standard vehicle registration number regex: e.g. KA01AB1234, DL-1C-AA-1111, or BUS-01
const regNoRegex = /^[A-Z0-9-]{4,15}$/i;

export const createBusSchema = z.object({
  busNumber: z.string().min(1, 'Bus number is required').max(20),
  registrationNumber: z
    .string()
    .min(3, 'Registration number is required')
    .max(20)
    .regex(regNoRegex, 'Invalid registration number format (e.g. KA01AB1234 or BUS-01)'),
  capacity: z.number().int().positive('Capacity must be a positive integer').max(150),
  driverId: z.string().optional(),
  gpsDeviceId: z.string().optional(),
  currentRouteId: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 2).optional(),
  status: z.enum(['active', 'inactive', 'maintenance', 'decommissioned']).default('active'),
});

export const updateBusSchema = createBusSchema.partial().extend({
  driverId: z.string().nullable().optional(),
  gpsDeviceId: z.string().nullable().optional(),
  currentRouteId: z.string().nullable().optional(),
  currentTripId: z.string().nullable().optional(),
});

export type CreateBusInput = z.infer<typeof createBusSchema>;
export type UpdateBusInput = z.infer<typeof updateBusSchema>;
