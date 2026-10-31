import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { verifyFirebaseToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { asyncHandler } from '../middleware/errorHandler';
import { successResponse } from '../utils/responseHelpers';
import { GPS_STALE_THRESHOLD_MS } from '@captain-campus/shared_types';

const router = Router();

router.get(
  '/',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const now = Date.now();
    const staleThreshold = now - GPS_STALE_THRESHOLD_MS;

    const [
      { count: totalBuses },
      { count: activeBuses },
      { count: activeTrips },
      { count: delayedTrips },
      { count: totalStops },
      { count: totalRoutes },
      { data: liveLocations },
      { data: recentAnnouncements },
    ] = await Promise.all([
      supabase.from('buses').select('*', { count: 'exact', head: true }),
      supabase.from('buses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('trips').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
      supabase.from('trips').select('*', { count: 'exact', head: true }).eq('status', 'delayed'),
      supabase.from('stops').select('*', { count: 'exact', head: true }),
      supabase.from('routes').select('*', { count: 'exact', head: true }).eq('active', true),
      supabase.from('live_locations').select('bus_id, timestamp, source'),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(5),
    ]);

    const liveCount = (liveLocations || []).filter(
      (l: any) => l.timestamp && Number(l.timestamp) > staleThreshold
    ).length;
    const staleCount = (liveLocations || []).length - liveCount;
    const simulatedCount = (liveLocations || []).filter((l: any) => l.source === 'simulator').length;

    res.json(
      successResponse({
        totalBuses: totalBuses || 0,
        activeBuses: activeBuses || 0,
        activeTrips: activeTrips || 0,
        delayedTrips: delayedTrips || 0,
        totalStops: totalStops || 0,
        totalRoutes: totalRoutes || 0,
        liveTrackedBuses: liveCount,
        staleGpsCount: staleCount,
        simulatedBuses: simulatedCount,
        recentAnnouncements: recentAnnouncements || [],
      })
    );
  })
);

export default router;
