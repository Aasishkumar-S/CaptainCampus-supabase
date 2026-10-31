import { Router, Request, Response } from 'express';
import { supabase, nowISO, nowMs } from '../config/supabase';
import { verifyFirebaseToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { successResponse } from '../utils/responseHelpers';
import { writeAuditLog } from '../utils/auditLogger';
import { createBusSchema, updateBusSchema } from '../validation/busSchemas';
import { Bus, LiveLocationWithStatus, GPS_STALE_THRESHOLD_MS } from '@captain-campus/shared_types';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Helper to map DB snake_case to API camelCase
function mapBus(row: Record<string, any>): Bus {
  return {
    busId: row.bus_id,
    busNumber: row.bus_number,
    registrationNumber: row.registration_number,
    capacity: row.capacity,
    make: row.make,
    model: row.model,
    year: row.year,
    status: row.status,
    currentRouteId: row.current_route_id,
    currentTripId: row.current_trip_id,
    driverId: row.driver_id,
    gpsDeviceId: row.gps_device_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLiveLocation(row: Record<string, any> | null, busNumber?: string, routeId?: string): LiveLocationWithStatus | undefined {
  if (!row) return undefined;
  const now = nowMs();
  const isStale = now - (Number(row.timestamp) || 0) > GPS_STALE_THRESHOLD_MS;
  return {
    busId: row.bus_id,
    tripId: row.trip_id,
    latitude: row.latitude,
    longitude: row.longitude,
    speed: row.speed,
    heading: row.heading,
    accuracy: row.accuracy,
    altitude: row.altitude,
    source: row.source,
    deviceId: row.device_id,
    timestamp: Number(row.timestamp),
    serverTimestamp: row.server_timestamp ? Number(row.server_timestamp) : undefined,
    isStale,
    staleSinceMs: isStale ? now - (Number(row.timestamp) || 0) : undefined,
    busNumber,
    routeId,
  };
}

// GET /api/v1/buses
router.get(
  '/',
  verifyFirebaseToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { data: rows, error } = await supabase
      .from('buses')
      .select('*')
      .in('status', ['active', 'maintenance'])
      .order('bus_number');

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');

    const { data: liveRows } = await supabase.from('live_locations').select('*');
    const liveMap: Record<string, any> = {};
    (liveRows || []).forEach((loc: any) => {
      liveMap[loc.bus_id] = loc;
    });

    const result = (rows || []).map((row: any) => {
      const bus = mapBus(row);
      const liveLocation = mapLiveLocation(liveMap[row.bus_id] || null, bus.busNumber, bus.currentRouteId);
      return {
        ...bus,
        liveLocation,
      };
    });

    res.json(successResponse(result));
  })
);

// GET /api/v1/buses/:busId
router.get(
  '/:busId',
  verifyFirebaseToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { busId } = req.params;
    const { data: row, error } = await supabase
      .from('buses')
      .select('*')
      .eq('bus_id', busId)
      .single();

    if (error || !row) throw new AppError(`Bus with ID '${busId}' not found`, 404, 'BUS_NOT_FOUND');

    res.json(successResponse(mapBus(row)));
  })
);

// GET /api/v1/buses/:busId/location
router.get(
  '/:busId/location',
  verifyFirebaseToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { busId } = req.params;
    const { data: row } = await supabase
      .from('live_locations')
      .select('*')
      .eq('bus_id', busId)
      .single();

    if (!row) {
      return res.json(
        successResponse(null, `No live location telemetry currently available for bus ${busId}`)
      );
    }

    res.json(successResponse(mapLiveLocation(row)));
  })
);

// POST /api/v1/buses
router.post(
  '/',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = createBusSchema.parse(req.body);

    const { data: existing } = await supabase
      .from('buses')
      .select('bus_id')
      .eq('registration_number', validatedData.registrationNumber.toUpperCase())
      .single();

    if (existing) {
      throw new AppError(
        `Bus with registration number '${validatedData.registrationNumber}' already exists`,
        409,
        'DUPLICATE_REGISTRATION'
      );
    }

    const busId = uuidv4();
    const now = nowISO();

    const { data: row, error } = await supabase
      .from('buses')
      .insert({
        bus_id: busId,
        bus_number: validatedData.busNumber,
        registration_number: validatedData.registrationNumber.toUpperCase(),
        capacity: validatedData.capacity,
        driver_id: validatedData.driverId,
        gps_device_id: validatedData.gpsDeviceId,
        current_route_id: validatedData.currentRouteId,
        status: validatedData.status,
        make: validatedData.make,
        model: validatedData.model,
        year: validatedData.year,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');

    const newBus = mapBus(row);

    await writeAuditLog({
      actorId: req.user!.uid,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'bus.created',
      affectedCollection: 'buses',
      affectedDocId: busId,
      after: newBus as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.status(201).json(successResponse(newBus, 'Bus created successfully'));
  })
);

// PATCH /api/v1/buses/:busId
router.patch(
  '/:busId',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { busId } = req.params;
    const validatedData = updateBusSchema.parse(req.body);

    const { data: existing, error: fetchError } = await supabase
      .from('buses')
      .select('*')
      .eq('bus_id', busId)
      .single();

    if (fetchError || !existing) throw new AppError(`Bus with ID '${busId}' not found`, 404, 'BUS_NOT_FOUND');

    const beforeData = mapBus(existing);

    if (
      validatedData.registrationNumber &&
      validatedData.registrationNumber.toUpperCase() !== existing.registration_number
    ) {
      const { data: dup } = await supabase
        .from('buses')
        .select('bus_id')
        .eq('registration_number', validatedData.registrationNumber.toUpperCase())
        .single();

      if (dup && dup.bus_id !== busId) {
        throw new AppError(
          `Bus with registration number '${validatedData.registrationNumber}' already exists`,
          409,
          'DUPLICATE_REGISTRATION'
        );
      }
    }

    const updates: Record<string, any> = {
      updated_at: nowISO(),
    };
    if (validatedData.busNumber !== undefined) updates.bus_number = validatedData.busNumber;
    if (validatedData.capacity !== undefined) updates.capacity = validatedData.capacity;
    if (validatedData.driverId !== undefined) updates.driver_id = validatedData.driverId;
    if (validatedData.gpsDeviceId !== undefined) updates.gps_device_id = validatedData.gpsDeviceId;
    if (validatedData.currentRouteId !== undefined) updates.current_route_id = validatedData.currentRouteId;
    if (validatedData.currentTripId !== undefined) updates.current_trip_id = validatedData.currentTripId;
    if (validatedData.status !== undefined) updates.status = validatedData.status;
    if (validatedData.make !== undefined) updates.make = validatedData.make;
    if (validatedData.model !== undefined) updates.model = validatedData.model;
    if (validatedData.year !== undefined) updates.year = validatedData.year;
    if (validatedData.registrationNumber) updates.registration_number = validatedData.registrationNumber.toUpperCase();

    const { data: updated, error } = await supabase
      .from('buses')
      .update(updates)
      .eq('bus_id', busId)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');

    const updatedDoc = mapBus(updated);

    await writeAuditLog({
      actorId: req.user!.uid,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'bus.updated',
      affectedCollection: 'buses',
      affectedDocId: busId,
      before: beforeData as unknown as Record<string, unknown>,
      after: updatedDoc as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.json(successResponse(updatedDoc, 'Bus updated successfully'));
  })
);

// DELETE /api/v1/buses/:busId
router.delete(
  '/:busId',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { busId } = req.params;

    const { data: existing } = await supabase
      .from('buses')
      .select('*')
      .eq('bus_id', busId)
      .single();

    if (!existing) throw new AppError(`Bus with ID '${busId}' not found`, 404, 'BUS_NOT_FOUND');

    const beforeData = mapBus(existing);
    const updates = {
      status: 'decommissioned',
      updated_at: nowISO(),
    };

    const { error } = await supabase.from('buses').update(updates).eq('bus_id', busId);
    if (error) throw new AppError(error.message, 500, 'DB_ERROR');

    await writeAuditLog({
      actorId: req.user!.uid,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'bus.deleted',
      affectedCollection: 'buses',
      affectedDocId: busId,
      before: beforeData as unknown as Record<string, unknown>,
      after: { ...beforeData, status: 'decommissioned' },
      ipAddress: req.ip,
    });

    res.json(successResponse({ busId, status: 'decommissioned' }, 'Bus deactivated successfully'));
  })
);

export default router;
