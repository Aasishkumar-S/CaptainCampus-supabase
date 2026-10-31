import { z } from 'zod';

export const createAnnouncementSchema = z.object({
  title: z.string().min(3).max(100),
  message: z.string().min(5).max(2000),
  severity: z.enum(['info', 'warning', 'critical']),
  affectedRouteIds: z.array(z.string()).default([]),
  affectedStopIds: z.array(z.string()).optional(),
  affectedBusIds: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published']).default('published'),
  expiresAt: z.string().datetime({ offset: true }).optional(),
  publishAt: z.string().datetime({ offset: true }).optional(),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
