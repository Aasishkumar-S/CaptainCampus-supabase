import { z } from 'zod';

export const createDriverSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  email: z.string().email().optional(),
  licenceNumber: z.string().min(5).max(30),
  licenceExpiry: z.string().datetime({ offset: true }).or(z.string().date()),
  employeeId: z.string().max(20).optional(),
  status: z.enum(['active', 'inactive', 'on_leave', 'suspended']).default('active'),
});

export const updateDriverSchema = createDriverSchema.partial();

export const assignDriverSchema = z.object({
  busId: z.string().min(1),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
export type AssignDriverInput = z.infer<typeof assignDriverSchema>;
