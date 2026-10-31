import { Router, Request, Response } from 'express';
import { supabase, nowISO } from '../config/supabase';
import { verifyFirebaseToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { successResponse } from '../utils/responseHelpers';
import { writeAuditLog } from '../utils/auditLogger';
import { createStopSchema, updateStopSchema } from '../validation/stopSchemas';
import { Stop } from '@captain-campus/shared_types';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

function mapStop(row: Record<string, any>): Stop {
  return {
    stopId: row.stop_id,
    name: row.name,
    description: row.landmark || row.description,
    address: row.address,
    status: row.status || 'active',
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

// GET /api/v1/stops
router.get(
  '/',
  verifyFirebaseToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { data: rows, error } = await supabase.from('stops').select('*').order('name');
    if (error) throw new AppError(error.message, 500, 'DB_ERROR');
    res.json(successResponse((rows || []).map(mapStop)));
  })
);

// GET /api/v1/stops/:stopId
router.get(
  '/:stopId',
  verifyFirebaseToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { data: row, error } = await supabase.from('stops').select('*').eq('stop_id', req.params.stopId).single();
    if (error || !row) throw new AppError(`Stop with ID '${req.params.stopId}' not found`, 404, 'STOP_NOT_FOUND');
    res.json(successResponse(mapStop(row)));
  })
);

// POST /api/v1/stops
router.post(
  '/',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = createStopSchema.parse(req.body);
    const stopId = uuidv4();
    const now = nowISO();

    const { data: row, error } = await supabase
      .from('stops')
      .insert({
        stop_id: stopId,
        name: validatedData.name.trim(),
        landmark: validatedData.description?.trim() || validatedData.address?.trim(),
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        created_at: now,
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');

    const created = mapStop(row);

    await writeAuditLog({
      actorId: req.user!.uid,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'stop.created',
      affectedCollection: 'stops',
      affectedDocId: stopId,
      after: created as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.status(201).json(successResponse(created, 'Stop created successfully'));
  })
);

// PATCH /api/v1/stops/:stopId
router.patch(
  '/:stopId',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { stopId } = req.params;
    const validatedData = updateStopSchema.parse(req.body);

    const { data: existing } = await supabase.from('stops').select('*').eq('stop_id', stopId).single();
    if (!existing) throw new AppError(`Stop with ID '${stopId}' not found`, 404, 'STOP_NOT_FOUND');

    const update: Record<string, any> = {};
    if (validatedData.name) update.name = validatedData.name.trim();
    if (validatedData.description !== undefined || validatedData.address !== undefined) {
      update.landmark = (validatedData.description || validatedData.address || '').trim();
    }
    if (validatedData.latitude !== undefined) update.latitude = validatedData.latitude;
    if (validatedData.longitude !== undefined) update.longitude = validatedData.longitude;

    const { data: row, error } = await supabase
      .from('stops')
      .update(update)
      .eq('stop_id', stopId)
      .select()
      .single();

    if (error || !row) throw new AppError(`Stop with ID '${stopId}' not found`, 404, 'STOP_NOT_FOUND');

    const updated = mapStop(row);

    await writeAuditLog({
      actorId: req.user!.uid,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'stop.updated',
      affectedCollection: 'stops',
      affectedDocId: stopId,
      before: mapStop(existing) as unknown as Record<string, unknown>,
      after: updated as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.json(successResponse(updated, 'Stop updated successfully'));
  })
);

// DELETE /api/v1/stops/:stopId
router.delete(
  '/:stopId',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { stopId } = req.params;
    const { error } = await supabase.from('stops').delete().eq('stop_id', stopId);
    if (error) throw new AppError(error.message, 500, 'DB_ERROR');

    await writeAuditLog({
      actorId: req.user!.uid,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'stop.deleted',
      affectedCollection: 'stops',
      affectedDocId: stopId,
      ipAddress: req.ip,
    });

    res.json(successResponse({ stopId }, 'Stop deleted'));
  })
);

export default router;
