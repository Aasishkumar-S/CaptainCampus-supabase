import { Router, Request, Response } from 'express';
import { supabase, nowISO } from '../config/supabase';
import { verifyFirebaseToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { successResponse, paginatedResponse } from '../utils/responseHelpers';
import { writeAuditLog } from '../utils/auditLogger';
import {
  createTripSchema,
  delayTripSchema,
  cancelTripSchema,
} from '../validation/tripSchemas';
import { Trip, TripStatus } from '@captain-campus/shared_types';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

function mapTrip(row: Record<string, any>): Trip {
  return {
    tripId: row.trip_id,
    busId: row.bus_id,
    routeId: row.route_id,
    driverId: row.driver_id,
    status: row.status,
    scheduledStart: row.scheduled_start,
    scheduledEnd: row.scheduled_end,
    actualStart: row.actual_start,
    actualEnd: row.actual_end,
    delayMinutes: row.delay_minutes,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/v1/trips
router.get(
  '/',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { status, busId, routeId, driverId, date } = req.query;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(req.query.pageSize as string, 10) || 20));

    let query = supabase.from('trips').select('*', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (busId) query = query.eq('bus_id', busId);
    if (routeId) query = query.eq('route_id', routeId);
    if (driverId) query = query.eq('driver_id', driverId);

    if (date && typeof date === 'string') {
      const datePrefix = date.split('T')[0];
      query = query.gte('scheduled_start', `${datePrefix}T00:00:00Z`).lte('scheduled_start', `${datePrefix}T23:59:59Z`);
    }

    query = query.order('scheduled_start', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);

    const { data: rows, error, count } = await query;
    if (error) throw new AppError(error.message, 500, 'DB_ERROR');

    const trips = (rows || []).map(mapTrip);
    res.json(successResponse(paginatedResponse(trips, count || 0, page, pageSize)));
  })
);

// GET /api/v1/trips/:tripId
router.get(
  '/:tripId',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { tripId } = req.params;
    const { data: row, error } = await supabase.from('trips').select('*').eq('trip_id', tripId).single();

    if (error || !row) {
      throw new AppError(`Trip with ID '${tripId}' not found`, 404, 'TRIP_NOT_FOUND');
    }

    res.json(successResponse(mapTrip(row)));
  })
);

// POST /api/v1/trips
router.post(
  '/',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = createTripSchema.parse(req.body);

    const { data: bus } = await supabase.from('buses').select('*').eq('bus_id', validatedData.busId).single();
    if (!bus) throw new AppError(`Bus with ID '${validatedData.busId}' not found`, 404, 'BUS_NOT_FOUND');
    if (bus.status !== 'active') throw new AppError(`Bus '${bus.bus_number}' is not active`, 400, 'BUS_NOT_ACTIVE');

    // Check if bus already has an in_progress trip
    const { data: activeTrips } = await supabase
      .from('trips')
      .select('trip_id')
      .eq('bus_id', validatedData.busId)
      .eq('status', 'in_progress')
      .limit(1);

    if (activeTrips && activeTrips.length > 0) {
      throw new AppError(`Bus '${bus.bus_number}' already has a trip in progress`, 400, 'BUS_ALREADY_IN_TRIP');
    }

    const { data: driver } = await supabase.from('drivers').select('*').eq('driver_id', validatedData.driverId).single();
    if (!driver) throw new AppError(`Driver with ID '${validatedData.driverId}' not found`, 404, 'DRIVER_NOT_FOUND');
    if (driver.status !== 'active') throw new AppError(`Driver '${driver.name}' is not active`, 400, 'DRIVER_NOT_ACTIVE');

    const { data: route } = await supabase.from('routes').select('*').eq('route_id', validatedData.routeId).single();
    if (!route) throw new AppError(`Route with ID '${validatedData.routeId}' not found`, 404, 'ROUTE_NOT_FOUND');
    if (!route.active) throw new AppError(`Route '${route.route_code}' is not active`, 400, 'ROUTE_NOT_ACTIVE');

    const tripId = uuidv4();
    const now = nowISO();

    const { data: row, error } = await supabase
      .from('trips')
      .insert({
        trip_id: tripId,
        bus_id: validatedData.busId,
        driver_id: validatedData.driverId,
        route_id: validatedData.routeId,
        scheduled_start: validatedData.scheduledStart,
        scheduled_end: validatedData.scheduledEnd,
        status: 'scheduled',
        notes: validatedData.notes,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');

    const newTrip = mapTrip(row);

    await writeAuditLog({
      actorId: req.user!.uid,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'trip.scheduled',
      affectedCollection: 'trips',
      affectedDocId: tripId,
      after: newTrip as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.status(201).json(successResponse(newTrip, 'Trip scheduled successfully'));
  })
);

// PATCH /api/v1/trips/:tripId/start
router.patch(
  '/:tripId/start',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { tripId } = req.params;
    const { data: tripData } = await supabase.from('trips').select('*').eq('trip_id', tripId).single();

    if (!tripData) throw new AppError(`Trip with ID '${tripId}' not found`, 404, 'TRIP_NOT_FOUND');

    if (tripData.status !== 'scheduled' && tripData.status !== 'delayed') {
      throw new AppError(
        `Cannot start trip with status '${tripData.status}'. Trip must be scheduled or delayed.`,
        400,
        'INVALID_TRIP_STATUS'
      );
    }

    const now = nowISO();

    await Promise.all([
      supabase.from('trips').update({ status: 'in_progress', actual_start: now, updated_at: now }).eq('trip_id', tripId),
      supabase.from('buses').update({ current_trip_id: tripId, current_route_id: tripData.route_id, updated_at: now }).eq('bus_id', tripData.bus_id),
    ]);

    const { data: updated } = await supabase.from('trips').select('*').eq('trip_id', tripId).single();
    const updatedTrip = mapTrip(updated);

    await writeAuditLog({
      actorId: req.user!.uid,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'trip.started',
      affectedCollection: 'trips',
      affectedDocId: tripId,
      before: mapTrip(tripData) as unknown as Record<string, unknown>,
      after: updatedTrip as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.json(successResponse(updatedTrip, 'Trip started successfully'));
  })
);

// PATCH /api/v1/trips/:tripId/end
router.patch(
  '/:tripId/end',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { tripId } = req.params;
    const { data: tripData } = await supabase.from('trips').select('*').eq('trip_id', tripId).single();

    if (!tripData) throw new AppError(`Trip with ID '${tripId}' not found`, 404, 'TRIP_NOT_FOUND');

    if (tripData.status !== 'in_progress') {
      throw new AppError(
        `Cannot end trip with status '${tripData.status}'. Only in-progress trips can be ended.`,
        400,
        'INVALID_TRIP_STATUS'
      );
    }

    const now = nowISO();

    await Promise.all([
      supabase.from('trips').update({ status: 'completed', actual_end: now, updated_at: now }).eq('trip_id', tripId),
      supabase.from('buses').update({ current_trip_id: null, updated_at: now }).eq('bus_id', tripData.bus_id),
    ]);

    const { data: updated } = await supabase.from('trips').select('*').eq('trip_id', tripId).single();
    const updatedTrip = mapTrip(updated);

    await writeAuditLog({
      actorId: req.user!.uid,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'trip.ended',
      affectedCollection: 'trips',
      affectedDocId: tripId,
      before: mapTrip(tripData) as unknown as Record<string, unknown>,
      after: updatedTrip as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.json(successResponse(updatedTrip, 'Trip ended successfully'));
  })
);

// PATCH /api/v1/trips/:tripId/cancel
router.patch(
  '/:tripId/cancel',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { tripId } = req.params;
    const validatedData = cancelTripSchema.parse(req.body);

    const { data: tripData } = await supabase.from('trips').select('*').eq('trip_id', tripId).single();
    if (!tripData) throw new AppError(`Trip with ID '${tripId}' not found`, 404, 'TRIP_NOT_FOUND');

    if (tripData.status === 'completed' || tripData.status === 'cancelled') {
      throw new AppError(`Cannot cancel trip that is already ${tripData.status}`, 400, 'INVALID_TRIP_STATUS');
    }

    const now = nowISO();
    const notes = validatedData.reason
      ? `${tripData.notes ? tripData.notes + ' | ' : ''}Cancellation reason: ${validatedData.reason}`
      : tripData.notes;

    await supabase.from('trips').update({ status: 'cancelled', notes, updated_at: now }).eq('trip_id', tripId);

    if (tripData.status === 'in_progress') {
      await supabase.from('buses').update({ current_trip_id: null, updated_at: now }).eq('bus_id', tripData.bus_id);
    }

    const { data: updated } = await supabase.from('trips').select('*').eq('trip_id', tripId).single();
    const updatedTrip = mapTrip(updated);

    await writeAuditLog({
      actorId: req.user!.uid,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'trip.cancelled',
      affectedCollection: 'trips',
      affectedDocId: tripId,
      before: mapTrip(tripData) as unknown as Record<string, unknown>,
      after: updatedTrip as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.json(successResponse(updatedTrip, 'Trip cancelled successfully'));
  })
);

// PATCH /api/v1/trips/:tripId/delay
router.patch(
  '/:tripId/delay',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { tripId } = req.params;
    const validatedData = delayTripSchema.parse(req.body);

    const { data: tripData } = await supabase.from('trips').select('*').eq('trip_id', tripId).single();
    if (!tripData) throw new AppError(`Trip with ID '${tripId}' not found`, 404, 'TRIP_NOT_FOUND');

    const now = nowISO();
    const notes = validatedData.reason
      ? `${tripData.notes ? tripData.notes + ' | ' : ''}Delay reason: ${validatedData.reason}`
      : tripData.notes;

    await supabase
      .from('trips')
      .update({
        status: 'delayed',
        delay_minutes: validatedData.delayMinutes,
        notes,
        updated_at: now,
      })
      .eq('trip_id', tripId);

    const { data: updated } = await supabase.from('trips').select('*').eq('trip_id', tripId).single();
    const updatedTrip = mapTrip(updated);

    await writeAuditLog({
      actorId: req.user!.uid,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'trip.delayed',
      affectedCollection: 'trips',
      affectedDocId: tripId,
      before: mapTrip(tripData) as unknown as Record<string, unknown>,
      after: updatedTrip as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.json(successResponse(updatedTrip, 'Trip marked as delayed'));
  })
);

export default router;
