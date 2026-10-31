import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { verifyFirebaseToken } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { successResponse } from '../utils/responseHelpers';
import { haversineDistanceM } from '../utils/haversine';
import {
  GPS_STALE_THRESHOLD_MS,
  MISSED_BUS_WAIT_WINDOW_MINUTES,
  MAX_WALKING_DISTANCE_METERS,
  Route,
  Stop,
  Bus,
  LiveLocation,
  MissedBusRequest,
  MissedBusRecommendation,
  MissedBusResponseData,
  StopWithDistance,
} from '@captain-campus/shared_types';

const router = Router();

/**
 * POST /api/v1/missed-bus
 * Intelligent Alternative Bus Recommendation Engine using Supabase data layer
 */
router.post(
  '/',
  verifyFirebaseToken,
  asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as MissedBusRequest;
    const {
      preferredStopId,
      preferredRouteId,
      destinationStopId,
      studentLatitude,
      studentLongitude,
    } = payload;

    if (!preferredStopId) {
      throw new AppError('Field "preferredStopId" is required', 400, 'MISSING_PREFERRED_STOP');
    }

    const maxWalkingMeters = payload.maxWalkingDistanceMeters || MAX_WALKING_DISTANCE_METERS; // 800m default

    // Step 1: Retrieve stops catalog
    const { data: stopsRows, error: stopsError } = await supabase.from('stops').select('*');
    if (stopsError) throw new AppError(stopsError.message, 500, 'DB_ERROR');

    const stopsMap = new Map<string, Stop>();
    (stopsRows || []).forEach((row: any) => {
      const stop: Stop = {
        stopId: row.stop_id,
        name: row.name,
        description: row.landmark,
        status: 'active',
        latitude: row.latitude,
        longitude: row.longitude,
        createdAt: row.created_at,
        updatedAt: row.created_at,
      };
      stopsMap.set(stop.stopId, stop);
    });

    const originalStop = stopsMap.get(preferredStopId);
    if (!originalStop) {
      throw new AppError(`Preferred stop "${preferredStopId}" not found`, 404, 'STOP_NOT_FOUND');
    }

    const originLat = (studentLatitude != null && studentLongitude != null)
      ? studentLatitude
      : originalStop.latitude;
    const originLng = (studentLatitude != null && studentLongitude != null)
      ? studentLongitude
      : originalStop.longitude;

    // Step 2: Retrieve active routes and their stop sequences
    const { data: routesRows } = await supabase.from('routes').select('*').eq('active', true);
    const { data: routeStopsRows } = await supabase.from('route_stops').select('*').order('sequence');

    const routeStopsMap = new Map<string, any[]>();
    (routeStopsRows || []).forEach((rs: any) => {
      if (!routeStopsMap.has(rs.route_id)) {
        routeStopsMap.set(rs.route_id, []);
      }
      routeStopsMap.get(rs.route_id)!.push({
        stopId: rs.stop_id,
        sequence: rs.sequence,
        arrivalOffsetMinutes: rs.arrival_offset_minutes,
        scheduledOffset: rs.arrival_offset_minutes,
      });
    });

    const routesMap = new Map<string, Route>();
    (routesRows || []).forEach((r: any) => {
      routesMap.set(r.route_id, {
        routeId: r.route_id,
        routeCode: r.route_code,
        routeName: r.route_name,
        direction: r.direction,
        originStopId: '',
        destinationStopId: '',
        operatingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        color: r.color,
        status: r.active ? 'active' : 'inactive',
        estimatedDuration: r.estimated_duration,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        stopSequence: (routeStopsMap.get(r.route_id) || []).map((s: any) => ({
          ...s,
          isPickup: true,
          isDropoff: true,
        })),
      });
    });

    // Step 3: Fetch active buses & live locations
    const { data: busesRows } = await supabase.from('buses').select('*').in('status', ['active', 'maintenance']);
    const busesList: Bus[] = (busesRows || []).map((b: any) => ({
      busId: b.bus_id,
      busNumber: b.bus_number,
      registrationNumber: b.registration_number,
      capacity: b.capacity,
      make: b.make,
      model: b.model,
      year: b.year,
      status: b.status,
      currentRouteId: b.current_route_id,
      currentTripId: b.current_trip_id,
      driverId: b.driver_id,
      gpsDeviceId: b.gps_device_id,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    }));

    const { data: liveLocationsRows } = await supabase.from('live_locations').select('*');
    const liveLocationsMap: Record<string, LiveLocation> = {};
    (liveLocationsRows || []).forEach((loc: any) => {
      liveLocationsMap[loc.bus_id] = {
        busId: loc.bus_id,
        tripId: loc.trip_id,
        latitude: loc.latitude,
        longitude: loc.longitude,
        speed: loc.speed,
        heading: loc.heading,
        accuracy: loc.accuracy,
        altitude: loc.altitude,
        source: loc.source,
        deviceId: loc.device_id,
        timestamp: Number(loc.timestamp),
        serverTimestamp: loc.server_timestamp ? Number(loc.server_timestamp) : undefined,
      };
    });

    const now = Date.now();
    const recommendations: MissedBusRecommendation[] = [];

    const getWalkingMinutes = (distM: number) => Math.ceil(distM / (1.3 * 60));

    const estimateTravelMinutes = (route: Route, fromSeq: number, toSeq: number) => {
      let totalM = 0;
      const sortedStops = [...(route.stopSequence || [])].sort((a, b) => a.sequence - b.sequence);
      for (let i = fromSeq; i < toSeq; i++) {
        const s1 = stopsMap.get(sortedStops[i - 1]?.stopId);
        const s2 = stopsMap.get(sortedStops[i]?.stopId);
        if (s1 && s2) {
          totalM += haversineDistanceM(s1.latitude, s1.longitude, s2.latitude, s2.longitude);
        } else {
          totalM += 500;
        }
      }
      return Math.max(1, Math.round(totalM / 416));
    };

    const calculateBusEtaToStop = (
      bus: Bus,
      route: Route,
      targetStopId: string
    ): { etaMinutes: number; valid: boolean; stopSeq: number } => {
      const stopSeqList = route.stopSequence || [];
      const targetEntry = stopSeqList.find((s) => s.stopId === targetStopId);
      if (!targetEntry) return { etaMinutes: -1, valid: false, stopSeq: -1 };

      const loc = liveLocationsMap[bus.busId];
      if (!loc) {
        const offset = targetEntry.scheduledOffset ?? (targetEntry.sequence * 3);
        return { etaMinutes: offset, valid: true, stopSeq: targetEntry.sequence };
      }

      if (now - (loc.timestamp || 0) > GPS_STALE_THRESHOLD_MS) {
        return { etaMinutes: -1, valid: false, stopSeq: targetEntry.sequence };
      }

      let closestSeq = 1;
      let minDistance = Infinity;

      for (const entry of stopSeqList) {
        const s = stopsMap.get(entry.stopId);
        if (s) {
          const d = haversineDistanceM(loc.latitude, loc.longitude, s.latitude, s.longitude);
          if (d < minDistance) {
            minDistance = d;
            closestSeq = entry.sequence;
          }
        }
      }

      if (closestSeq > targetEntry.sequence) {
        return { etaMinutes: -1, valid: false, stopSeq: targetEntry.sequence };
      }

      const remainingDistanceM = haversineDistanceM(
        loc.latitude,
        loc.longitude,
        stopsMap.get(targetStopId)?.latitude || loc.latitude,
        stopsMap.get(targetStopId)?.longitude || loc.longitude
      );

      const intermediateMins = estimateTravelMinutes(route, closestSeq, targetEntry.sequence);
      const currentSpeedMPerMin = loc.speed && loc.speed > 5 ? (loc.speed * 1000) / 60 : 400;
      const etaMinutes = Math.max(1, Math.round(remainingDistanceM / currentSpeedMPerMin) + (intermediateMins > 2 ? intermediateMins : 0));

      return { etaMinutes, valid: true, stopSeq: targetEntry.sequence };
    };

    // Step 4: Check if ANY bus reaches the SAME original stop within waiting window (15 mins)
    for (const bus of busesList) {
      if (!bus.currentRouteId) continue;
      const route = routesMap.get(bus.currentRouteId);
      if (!route) continue;

      if (preferredRouteId && route.routeId !== preferredRouteId) continue;

      const { etaMinutes, valid } = calculateBusEtaToStop(bus, route, preferredStopId);

      if (valid && etaMinutes >= 0 && etaMinutes <= MISSED_BUS_WAIT_WINDOW_MINUTES) {
        const depTime = new Date(now + etaMinutes * 60000).toISOString();
        recommendations.push({
          type: 'next_bus_same_stop',
          busId: bus.busId,
          busNumber: bus.busNumber,
          routeId: route.routeId,
          routeCode: route.routeCode,
          routeName: route.routeName,
          departureStopId: originalStop.stopId,
          departureStopName: originalStop.name,
          etaMinutes,
          estimatedDepartureTime: depTime,
          walkingDistanceMeters: 0,
          walkingMinutes: 0,
          advice: `Stay at ${originalStop.name}. Next shuttle ${bus.busNumber} (${route.routeCode}) will arrive in ${etaMinutes} mins.`,
        });
      }
    }

    // Step 5: Search for alternative reachable stops within walking distance
    const nearbyStopsWithDistance: StopWithDistance[] = [];

    for (const [sId, stop] of stopsMap.entries()) {
      if (sId === preferredStopId) continue;

      const distM = Math.round(haversineDistanceM(originLat, originLng, stop.latitude, stop.longitude));
      if (distM <= maxWalkingMeters) {
        const walkMin = getWalkingMinutes(distM);
        nearbyStopsWithDistance.push({
          ...stop,
          distanceMeters: distM,
          walkingMinutes: walkMin,
        });
      }
    }

    nearbyStopsWithDistance.sort((a, b) => a.distanceMeters - b.distanceMeters);

    // Step 6: For each nearby alternative stop, check candidate upcoming buses
    for (const altStop of nearbyStopsWithDistance) {
      const walkTime = altStop.walkingMinutes || getWalkingMinutes(altStop.distanceMeters);

      for (const bus of busesList) {
        if (!bus.currentRouteId) continue;
        const route = routesMap.get(bus.currentRouteId);
        if (!route) continue;

        const { etaMinutes, valid, stopSeq } = calculateBusEtaToStop(bus, route, altStop.stopId);

        if (valid && etaMinutes >= walkTime && (etaMinutes - walkTime) <= MISSED_BUS_WAIT_WINDOW_MINUTES) {
          if (destinationStopId) {
            const destEntry = route.stopSequence?.find((s) => s.stopId === destinationStopId);
            if (!destEntry || destEntry.sequence <= stopSeq) {
              continue;
            }
          }

          const depTime = new Date(now + etaMinutes * 60000).toISOString();
          const waitTime = etaMinutes - walkTime;
          const isSameRoute = preferredRouteId && route.routeId === preferredRouteId;

          recommendations.push({
            type: isSameRoute ? 'alternative_stop_same_route' : 'alternative_route',
            busId: bus.busId,
            busNumber: bus.busNumber,
            routeId: route.routeId,
            routeCode: route.routeCode,
            routeName: route.routeName,
            departureStopId: altStop.stopId,
            departureStopName: altStop.name,
            etaMinutes,
            estimatedDepartureTime: depTime,
            walkingDistanceMeters: altStop.distanceMeters,
            walkingMinutes: walkTime,
            advice: `Walk ${altStop.distanceMeters}m (~${walkTime} min) to ${altStop.name}. Catch Shuttle ${bus.busNumber} (${route.routeCode}) arriving in ${etaMinutes} mins (wait: ~${waitTime} min).`,
          });
        }
      }
    }

    // Step 7: Rank alternatives
    recommendations.sort((a, b) => {
      if (a.type === 'next_bus_same_stop' && b.type !== 'next_bus_same_stop' && a.etaMinutes <= 10) {
        return -1;
      }
      if (b.type === 'next_bus_same_stop' && a.type !== 'next_bus_same_stop' && b.etaMinutes <= 10) {
        return 1;
      }
      const scoreA = (a.walkingMinutes || 0) + a.etaMinutes;
      const scoreB = (b.walkingMinutes || 0) + b.etaMinutes;
      return scoreA - scoreB;
    });

    const responseData: MissedBusResponseData = {
      originalStopId: preferredStopId,
      recommendations,
      nearbyStops: nearbyStopsWithDistance.slice(0, 5),
    };

    return res.json(
      successResponse(
        responseData,
        recommendations.length > 0
          ? `Found ${recommendations.length} feasible transit alternative(s)`
          : 'No immediate alternative shuttles found within the walking and waiting window.'
      )
    );
  })
);

export default router;
