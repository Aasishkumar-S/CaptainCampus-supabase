import { Router, Request, Response } from 'express';
import { supabase, nowISO } from '../config/supabase';
import { verifyFirebaseToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { successResponse } from '../utils/responseHelpers';
import { writeAuditLog } from '../utils/auditLogger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

async function getRouteWithStops(routeId: string) {
  const { data: route } = await supabase.from('routes').select('*').eq('route_id', routeId).single();
  if (!route) return null;

  const { data: routeStops } = await supabase
    .from('route_stops')
    .select('*, stops(*)')
    .eq('route_id', routeId)
    .order('sequence');

  const stopSequence = (routeStops || []).map((rs: any) => ({
    stopId: rs.stop_id,
    sequence: rs.sequence,
    scheduledOffset: rs.arrival_offset_minutes,
    isPickup: true,
    isDropoff: true,
    name: rs.stops?.name,
  }));

  return {
    routeId: route.route_id,
    routeCode: route.route_code,
    routeName: route.route_name,
    direction: route.direction,
    originStopId: stopSequence[0]?.stopId || '',
    destinationStopId: stopSequence[stopSequence.length - 1]?.stopId || '',
    operatingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    color: route.color,
    status: (route.active ? 'active' : 'inactive') as any,
    estimatedDuration: route.estimated_duration,
    createdAt: route.created_at,
    updatedAt: route.updated_at,
    stopSequence,
  };
}

// GET /api/v1/routes
router.get(
  '/',
  verifyFirebaseToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { data: rows, error } = await supabase
      .from('routes')
      .select('*')
      .eq('active', true)
      .order('route_code');

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');

    const routes = await Promise.all((rows || []).map((r: any) => getRouteWithStops(r.route_id)));
    res.json(successResponse(routes.filter(Boolean)));
  })
);

// GET /api/v1/routes/:routeId
router.get(
  '/:routeId',
  verifyFirebaseToken,
  asyncHandler(async (req: Request, res: Response) => {
    const route = await getRouteWithStops(req.params.routeId);
    if (!route) throw new AppError(`Route with ID '${req.params.routeId}' not found`, 404, 'ROUTE_NOT_FOUND');
    res.json(successResponse(route));
  })
);

// POST /api/v1/routes
router.post(
  '/',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { routeCode, routeName, direction, color, estimatedDuration, stopSequence } = req.body;
    if (!routeCode || !routeName) {
      throw new AppError('routeCode and routeName are required', 400, 'VALIDATION_ERROR');
    }

    const routeId = uuidv4();
    const now = nowISO();

    const { error } = await supabase.from('routes').insert({
      route_id: routeId,
      route_code: routeCode.trim().toUpperCase(),
      route_name: routeName.trim(),
      direction: direction || 'outbound',
      color: color || '#4f46e5',
      estimated_duration: estimatedDuration || 20,
      active: true,
      created_at: now,
      updated_at: now,
    });

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');

    if (Array.isArray(stopSequence) && stopSequence.length > 0) {
      const routeStopRows = stopSequence.map((s: any) => ({
        route_id: routeId,
        stop_id: s.stopId,
        sequence: s.sequence,
        arrival_offset_minutes: s.arrivalOffsetMinutes || s.scheduledOffset || 0,
      }));
      await supabase.from('route_stops').insert(routeStopRows);
    }

    const created = await getRouteWithStops(routeId);

    await writeAuditLog({
      actorId: req.user!.uid,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'route.created',
      affectedCollection: 'routes',
      affectedDocId: routeId,
      after: created as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.status(201).json(successResponse(created, 'Route created successfully'));
  })
);

// PATCH /api/v1/routes/:routeId
router.patch(
  '/:routeId',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { routeId } = req.params;
    const { routeName, direction, color, estimatedDuration, active, stopSequence } = req.body;

    const before = await getRouteWithStops(routeId);
    if (!before) throw new AppError(`Route with ID '${routeId}' not found`, 404, 'ROUTE_NOT_FOUND');

    const updatePayload: Record<string, any> = { updated_at: nowISO() };
    if (routeName !== undefined) updatePayload.route_name = routeName.trim();
    if (direction !== undefined) updatePayload.direction = direction;
    if (color !== undefined) updatePayload.color = color;
    if (estimatedDuration !== undefined) updatePayload.estimated_duration = estimatedDuration;
    if (active !== undefined) updatePayload.active = active;

    const { error } = await supabase.from('routes').update(updatePayload).eq('route_id', routeId);
    if (error) throw new AppError(error.message, 500, 'DB_ERROR');

    if (Array.isArray(stopSequence)) {
      await supabase.from('route_stops').delete().eq('route_id', routeId);
      if (stopSequence.length > 0) {
        await supabase.from('route_stops').insert(
          stopSequence.map((s: any) => ({
            route_id: routeId,
            stop_id: s.stopId,
            sequence: s.sequence,
            arrival_offset_minutes: s.arrivalOffsetMinutes || s.scheduledOffset || 0,
          }))
        );
      }
    }

    const updated = await getRouteWithStops(routeId);

    await writeAuditLog({
      actorId: req.user!.uid,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'route.updated',
      affectedCollection: 'routes',
      affectedDocId: routeId,
      before: before as unknown as Record<string, unknown>,
      after: updated as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.json(successResponse(updated, 'Route updated successfully'));
  })
);

// DELETE /api/v1/routes/:routeId
router.delete(
  '/:routeId',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { routeId } = req.params;
    const { error } = await supabase.from('routes').update({ active: false, updated_at: nowISO() }).eq('route_id', routeId);
    if (error) throw new AppError(error.message, 500, 'DB_ERROR');

    await writeAuditLog({
      actorId: req.user!.uid,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'route.deleted',
      affectedCollection: 'routes',
      affectedDocId: routeId,
      ipAddress: req.ip,
    });

    res.json(successResponse({ routeId }, 'Route deactivated'));
  })
);

export default router;
