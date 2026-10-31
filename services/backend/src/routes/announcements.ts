import { Router, Request, Response } from 'express';
import { supabase, nowISO } from '../config/supabase';
import { verifyFirebaseToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { successResponse, paginatedResponse } from '../utils/responseHelpers';
import { writeAuditLog } from '../utils/auditLogger';
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from '../validation/announcementSchemas';
import {
  Announcement,
  AnnouncementStatus,
} from '@captain-campus/shared_types';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from '../services/notificationService';

function mapAnnouncement(row: Record<string, any>): Announcement {
  return {
    announcementId: row.announcement_id,
    title: row.title,
    message: row.message,
    severity: row.severity,
    affectedRouteIds: row.route_id ? [row.route_id] : [],
    createdBy: row.created_by,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    status: (row.status || 'published') as AnnouncementStatus,
    fcmSent: !!row.fcm_sent,
  };
}

/**
 * Public (Student) Announcements Router
 * Mounted at /api/v1/announcements
 */
export const announcementsPublicRouter = Router();

// GET /api/v1/announcements
announcementsPublicRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { routeId } = req.query;
    const nowIso = new Date().toISOString();

    let query = supabase.from('announcements').select('*');
    if (routeId && typeof routeId === 'string') {
      query = query.or(`route_id.eq.${routeId},route_id.is.null`);
    }

    query = query.order('created_at', { ascending: false });

    const { data: rows, error } = await query;
    if (error) throw new AppError(error.message, 500, 'DB_ERROR');

    const activeAnnouncements = (rows || [])
      .map(mapAnnouncement)
      .filter((a) => !a.expiresAt || a.expiresAt >= nowIso);

    res.json(successResponse(activeAnnouncements));
  })
);

/**
 * Admin Announcements Router
 * Mounted at /api/v1/admin/announcements
 */
export const announcementsAdminRouter = Router();

// GET /api/v1/admin/announcements
announcementsAdminRouter.get(
  '/',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(req.query.pageSize as string, 10) || 20));

    const { data: rows, error, count } = await supabase
      .from('announcements')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');

    const announcements = (rows || []).map(mapAnnouncement);
    res.json(successResponse(paginatedResponse(announcements, count || 0, page, pageSize)));
  })
);

// POST /api/v1/admin/announcements
announcementsAdminRouter.post(
  '/',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = createAnnouncementSchema.parse(req.body);

    const announcementId = uuidv4();
    const now = nowISO();
    const routeId = validatedData.affectedRouteIds?.[0] || null;

    const { data: row, error } = await supabase
      .from('announcements')
      .insert({
        announcement_id: announcementId,
        title: validatedData.title.trim(),
        message: validatedData.message.trim(),
        severity: validatedData.severity,
        route_id: routeId,
        created_by: req.user!.uid,
        expires_at: validatedData.expiresAt || null,
        created_at: now,
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');

    const newAnnouncement = mapAnnouncement(row);

    // Dispatch campus alert notification
    try {
      await NotificationService.sendCampusAlert({
        title: `Transit Announcement: ${newAnnouncement.title}`,
        body: newAnnouncement.message,
        type: 'announcement',
        relatedRouteId: routeId || undefined,
        data: {
          announcementId,
          severity: newAnnouncement.severity,
        },
      });
    } catch (err) {
      console.warn('Campus alert dispatch failed:', err);
    }

    await writeAuditLog({
      actorId: req.user!.uid,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'announcement.published',
      affectedCollection: 'announcements',
      affectedDocId: announcementId,
      after: newAnnouncement as unknown as Record<string, unknown>,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json(successResponse(newAnnouncement, 'Announcement created successfully'));
  })
);

// PATCH /api/v1/admin/announcements/:id
announcementsAdminRouter.patch(
  '/:id',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const validatedData = updateAnnouncementSchema.parse(req.body);

    const { data: existing, error: fetchErr } = await supabase
      .from('announcements')
      .select('*')
      .eq('announcement_id', id)
      .single();

    if (fetchErr || !existing) throw new AppError(`Announcement with ID '${id}' not found`, 404, 'ANNOUNCEMENT_NOT_FOUND');

    const updates: Record<string, any> = {};
    if (validatedData.title) updates.title = validatedData.title.trim();
    if (validatedData.message) updates.message = validatedData.message.trim();
    if (validatedData.severity) updates.severity = validatedData.severity;
    if (validatedData.affectedRouteIds) updates.route_id = validatedData.affectedRouteIds[0] || null;
    if (validatedData.expiresAt !== undefined) updates.expires_at = validatedData.expiresAt;

    const { data: updated, error } = await supabase
      .from('announcements')
      .update(updates)
      .eq('announcement_id', id)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');

    const updatedDoc = mapAnnouncement(updated);

    await writeAuditLog({
      actorId: req.user!.uid,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'announcement.published',
      affectedCollection: 'announcements',
      affectedDocId: id,
      before: mapAnnouncement(existing) as unknown as Record<string, unknown>,
      after: updatedDoc as unknown as Record<string, unknown>,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json(successResponse(updatedDoc, 'Announcement updated successfully'));
  })
);

// DELETE /api/v1/admin/announcements/:id
announcementsAdminRouter.delete(
  '/:id',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { data: existing } = await supabase
      .from('announcements')
      .select('*')
      .eq('announcement_id', id)
      .single();

    if (!existing) throw new AppError(`Announcement with ID '${id}' not found`, 404, 'ANNOUNCEMENT_NOT_FOUND');

    await supabase.from('announcements').delete().eq('announcement_id', id);

    await writeAuditLog({
      actorId: req.user!.uid,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'announcement.cancelled',
      affectedCollection: 'announcements',
      affectedDocId: id,
      before: mapAnnouncement(existing) as unknown as Record<string, unknown>,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json(successResponse({ announcementId: id }, 'Announcement deleted successfully'));
  })
);
