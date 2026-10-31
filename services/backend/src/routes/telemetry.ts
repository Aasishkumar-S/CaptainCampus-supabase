import { Router, Request, Response } from 'express';
import { supabase, nowISO, nowMs } from '../config/supabase';
import { verifyDeviceToken } from '../middleware/auth';
import { telemetryLimiter } from '../middleware/rateLimiter';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { successResponse } from '../utils/responseHelpers';
import { telemetryPayloadSchema } from '../validation/telemetrySchemas';

const router = Router();

/**
 * POST /api/v1/telemetry/location
 * Ingest real-time GPS coordinates from tracking device or simulator.
 * Requires device token authorization and rate limiting.
 * Upserts to Supabase live_locations table, broadcasting to Realtime subscribers.
 */
router.post(
  '/location',
  telemetryLimiter,
  verifyDeviceToken,
  asyncHandler(async (req: Request, res: Response) => {
    // 1. Validate payload schema with Zod
    const validatedData = telemetryPayloadSchema.parse(req.body);

    const busId = validatedData.busId;
    const deviceId = req.deviceId || validatedData.deviceId;

    // 2. Verify bus exists
    const { data: bus, error: busError } = await supabase
      .from('buses')
      .select('bus_id, current_trip_id, gps_device_id')
      .eq('bus_id', busId)
      .single();

    if (busError || !bus) {
      throw new AppError(`Bus with ID '${busId}' not found`, 404, 'BUS_NOT_FOUND');
    }

    // 3. Verify device assignment if gpsDeviceId is set on the bus and deviceId is provided
    if (
      deviceId &&
      deviceId !== 'device_secret_auth' &&
      bus.gps_device_id &&
      bus.gps_device_id !== deviceId
    ) {
      throw new AppError(
        `Device '${deviceId}' is not assigned to bus '${busId}'`,
        403,
        'DEVICE_BUS_MISMATCH'
      );
    }

    // 4. Construct live location record and upsert to Supabase
    const serverTimestamp = nowMs();
    const { error: upsertError } = await supabase.from('live_locations').upsert(
      {
        bus_id: busId,
        trip_id: validatedData.tripId || bus.current_trip_id,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        speed: validatedData.speed || 0,
        heading: validatedData.heading || 0,
        accuracy: validatedData.accuracy,
        altitude: validatedData.altitude,
        source: validatedData.source || 'gps',
        device_id: deviceId,
        timestamp: validatedData.timestamp || serverTimestamp,
        server_timestamp: serverTimestamp,
        updated_at: nowISO(),
      },
      { onConflict: 'bus_id' }
    );

    if (upsertError) {
      throw new AppError(upsertError.message, 500, 'DB_ERROR');
    }

    // 5. Update device lastSeenAt in gps_devices if deviceId is known
    if (deviceId && deviceId !== 'device_secret_auth') {
      void supabase
        .from('gps_devices')
        .upsert(
          {
            device_id: deviceId,
            bus_id: busId,
            status: 'online',
            last_seen_at: serverTimestamp,
            updated_at: nowISO(),
          },
          { onConflict: 'device_id' }
        );
    }

    res.json(successResponse({ recorded: true, busId, serverTimestamp }, 'Location telemetry received'));
  })
);

export default router;
