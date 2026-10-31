import { Router, Request, Response } from 'express';
import { supabase, nowMs } from '../config/supabase';
import { verifyFirebaseToken } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { successResponse } from '../utils/responseHelpers';
import { haversineDistanceM } from '../utils/haversine';
import { GPS_STALE_THRESHOLD_MS, ETAResult } from '@captain-campus/shared_types';

const router = Router();

/**
 * GET /api/v1/eta?stopId=&routeId=
 * Calculates real-time arrival estimates (ETA) for buses servicing the specified stop on a route.
 */
router.get(
  '/',
  verifyFirebaseToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { stopId, routeId } = req.query;

    if (!stopId || typeof stopId !== 'string') {
      throw new AppError('Query parameter "stopId" is required', 400, 'MISSING_PARAM_STOP_ID');
    }

    if (!routeId || typeof routeId !== 'string') {
      throw new AppError('Query parameter "routeId" is required', 400, 'MISSING_PARAM_ROUTE_ID');
    }

    // 1. Fetch route
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .select('*')
      .eq('route_id', routeId)
      .single();

    if (routeError || !route) {
      throw new AppError(`Route with ID '${routeId}' not found`, 404, 'ROUTE_NOT_FOUND');
    }

    // 2. Fetch route stops with coordinates
    const { data: routeStopRows } = await supabase
      .from('route_stops')
      .select('*, stops(*)')
      .eq('route_id', routeId)
      .order('sequence');

    const stopSequence = (routeStopRows || []).map((rs: any) => ({
      stopId: rs.stop_id,
      sequence: rs.sequence,
      stop: rs.stops,
    }));

    if (stopSequence.length === 0) {
      return res.json(successResponse([], 'Route has no stop sequence defined'));
    }

    // 3. Find stopId in stopSequence
    const targetStopEntry = stopSequence.find((entry) => entry.stopId === stopId);
    if (!targetStopEntry) {
      throw new AppError(
        `Stop '${stopId}' is not part of route '${routeId}'`,
        400,
        'STOP_NOT_ON_ROUTE'
      );
    }
    const targetSeq = targetStopEntry.sequence;

    // 4. Query active trips on this route
    const { data: activeTrips } = await supabase
      .from('trips')
      .select('*')
      .eq('route_id', routeId)
      .eq('status', 'in_progress');

    if (!activeTrips || activeTrips.length === 0) {
      return res.json(successResponse([], 'No active trips currently running on this route'));
    }

    const now = nowMs();
    const etaResults: ETAResult[] = [];

    // 5. Calculate ETA for each active trip
    for (const trip of activeTrips) {
      const { data: bus } = await supabase
        .from('buses')
        .select('bus_id, bus_number')
        .eq('bus_id', trip.bus_id)
        .single();

      const busNumber = bus?.bus_number || 'Unknown';

      const { data: liveLoc } = await supabase
        .from('live_locations')
        .select('*')
        .eq('bus_id', trip.bus_id)
        .single();

      if (!liveLoc || !liveLoc.latitude || !liveLoc.longitude) {
        etaResults.push({
          stopId,
          busId: trip.bus_id,
          tripId: trip.trip_id,
          busNumber,
          routeCode: route.route_code,
          etaMinutes: null,
          estimatedArrivalTime: null,
          isLiveEstimate: false,
          lastLocationUpdate: liveLoc?.timestamp ? Number(liveLoc.timestamp) : 0,
          isStale: true,
          confidence: 'unavailable',
          source: 'timetable',
        });
        continue;
      }

      const isStale = now - (Number(liveLoc.timestamp) || 0) > GPS_STALE_THRESHOLD_MS;

      // Find closest stop in sequence
      let closestStopIndex = 0;
      let minDistance = Infinity;

      for (let i = 0; i < stopSequence.length; i++) {
        const stopObj = stopSequence[i].stop;
        if (stopObj) {
          const dist = haversineDistanceM(
            liveLoc.latitude,
            liveLoc.longitude,
            stopObj.latitude,
            stopObj.longitude
          );
          if (dist < minDistance) {
            minDistance = dist;
            closestStopIndex = i;
          }
        }
      }

      let estimatedCurrentSegment = stopSequence[closestStopIndex].sequence;

      if (closestStopIndex < stopSequence.length - 1) {
        const currentStop = stopSequence[closestStopIndex].stop;
        const nextStop = stopSequence[closestStopIndex + 1].stop;

        if (currentStop && nextStop) {
          const totalSegmentDist = haversineDistanceM(
            currentStop.latitude,
            currentStop.longitude,
            nextStop.latitude,
            nextStop.longitude
          );

          const distToNext = haversineDistanceM(
            liveLoc.latitude,
            liveLoc.longitude,
            nextStop.latitude,
            nextStop.longitude
          );

          if (totalSegmentDist > 0) {
            const fraction = Math.max(0, Math.min(0.99, (totalSegmentDist - distToNext) / totalSegmentDist));
            estimatedCurrentSegment = stopSequence[closestStopIndex].sequence + fraction;
          }
        }
      }

      // If bus already passed target stop
      if (estimatedCurrentSegment > targetSeq) {
        continue;
      }

      const totalSegments = Math.max(1, stopSequence.length - 1);
      const estimatedTotalDuration = route.estimated_duration || 30;
      const avgTimePerSegment = estimatedTotalDuration / totalSegments;

      const remainingSegments = targetSeq - estimatedCurrentSegment;
      let etaMinutes = Math.ceil(remainingSegments * avgTimePerSegment);

      if (etaMinutes <= 0 && minDistance > 50) {
        etaMinutes = 1;
      }

      const arrivalTimeMs = now + etaMinutes * 60 * 1000;
      const estimatedArrivalTime = new Date(arrivalTimeMs).toISOString();

      let confidence: 'high' | 'medium' | 'low' | 'unavailable' = 'high';
      if (isStale) {
        confidence = 'low';
      } else if (liveLoc.accuracy && liveLoc.accuracy > 50) {
        confidence = 'medium';
      }

      etaResults.push({
        stopId,
        busId: trip.bus_id,
        tripId: trip.trip_id,
        busNumber,
        routeCode: route.route_code,
        etaMinutes,
        estimatedArrivalTime,
        isLiveEstimate: true,
        lastLocationUpdate: Number(liveLoc.timestamp),
        isStale,
        confidence,
        source: 'calculated',
      });
    }

    etaResults.sort((a, b) => {
      if (a.etaMinutes === null) return 1;
      if (b.etaMinutes === null) return -1;
      return a.etaMinutes - b.etaMinutes;
    });

    res.json(successResponse(etaResults));
  })
);

export default router;
