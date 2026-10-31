import { Router } from 'express';
import authRouter from './auth';
import busesRouter from './buses';
import routesRouter from './routes';
import stopsRouter from './stops';
import telemetryRouter from './telemetry';
import driversRouter from './drivers';
import tripsRouter from './trips';
import etaRouter from './eta';
import dashboardRouter from './dashboard';
import { announcementsPublicRouter, announcementsAdminRouter } from './announcements';
import missedBusRouter from './missedBus';

const router = Router();

// Health check
router.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } }));

// Auth
router.use('/', authRouter);

// Public (student) routes
router.use('/buses', busesRouter);
router.use('/routes', routesRouter);
router.use('/stops', stopsRouter);
router.use('/eta', etaRouter);
router.use('/missed-bus', missedBusRouter);
router.use('/announcements', announcementsPublicRouter);

// GPS telemetry (device auth)
router.use('/telemetry', telemetryRouter);

// Admin routes
router.use('/admin/buses', busesRouter);        // busesRouter handles its own admin sub-paths
router.use('/admin/routes', routesRouter);
router.use('/admin/stops', stopsRouter);
router.use('/admin/drivers', driversRouter);
router.use('/admin/trips', tripsRouter);
router.use('/admin/dashboard', dashboardRouter);
router.use('/admin/announcements', announcementsAdminRouter);

export default router;
