import { Router, Request, Response } from 'express';
import { supabase, nowISO } from '../config/supabase';
import { verifyFirebaseToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { successResponse, paginatedResponse } from '../utils/responseHelpers';
import { writeAuditLog } from '../utils/auditLogger';
import {
  createDriverSchema,
  updateDriverSchema,
  assignDriverSchema,
} from '../validation/driverSchemas';
import { Driver } from '@captain-campus/shared_types';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

function mapDriver(row: Record<string, any>): Driver {
  return {
    driverId: row.driver_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    licenceNumber: row.licence_number,
    licenceExpiry: row.licence_expiry || '2030-01-01',
    status: row.status,
    currentBusId: row.assigned_bus_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/v1/drivers
router.get(
  '/',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const statusFilter = req.query.status as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(req.query.pageSize as string, 10) || 20));

    let query = supabase.from('drivers').select('*', { count: 'exact' });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    query = query.order('name').range((page - 1) * pageSize, page * pageSize - 1);

    const { data: rows, error, count } = await query;
    if (error) throw new AppError(error.message, 500, 'DB_ERROR');

    const drivers = (rows || []).map(mapDriver);
    res.json(successResponse(paginatedResponse(drivers, count || 0, page, pageSize)));
  })
);

// GET /api/v1/drivers/:driverId
router.get(
  '/:driverId',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { driverId } = req.params;
    const { data: row, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('driver_id', driverId)
      .single();

    if (error || !row) throw new AppError(`Driver with ID '${driverId}' not found`, 404, 'DRIVER_NOT_FOUND');

    res.json(successResponse(mapDriver(row)));
  })
);

// POST /api/v1/drivers
router.post(
  '/',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = createDriverSchema.parse(req.body);

    const { data: dup } = await supabase
      .from('drivers')
      .select('driver_id')
      .eq('licence_number', validatedData.licenceNumber.toUpperCase())
      .single();

    if (dup) {
      throw new AppError(
        `Driver with licence number '${validatedData.licenceNumber}' already exists`,
        409,
        'DUPLICATE_LICENCE'
      );
    }

    const driverId = uuidv4();
    const now = nowISO();

    const { data: row, error } = await supabase
      .from('drivers')
      .insert({
        driver_id: driverId,
        name: validatedData.name.trim(),
        email: validatedData.email?.trim().toLowerCase(),
        phone: validatedData.phone.trim(),
        licence_number: validatedData.licenceNumber.trim().toUpperCase(),
        status: validatedData.status || 'active',
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');

    const newDriver = mapDriver(row);

    await writeAuditLog({
      actorId: req.user!.uid,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'driver.created',
      affectedCollection: 'drivers',
      affectedDocId: driverId,
      after: newDriver as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.status(201).json(successResponse(newDriver, 'Driver created successfully'));
  })
);

// PATCH /api/v1/drivers/:driverId
router.patch(
  '/:driverId',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { driverId } = req.params;
    const validatedData = updateDriverSchema.parse(req.body);

    const { data: existing, error: fetchErr } = await supabase
      .from('drivers')
      .select('*')
      .eq('driver_id', driverId)
      .single();

    if (fetchErr || !existing) throw new AppError(`Driver with ID '${driverId}' not found`, 404, 'DRIVER_NOT_FOUND');

    const beforeData = mapDriver(existing);

    if (validatedData.licenceNumber && validatedData.licenceNumber.toUpperCase() !== existing.licence_number) {
      const { data: dup } = await supabase
        .from('drivers')
        .select('driver_id')
        .eq('licence_number', validatedData.licenceNumber.toUpperCase())
        .single();

      if (dup && dup.driver_id !== driverId) {
        throw new AppError(
          `Licence number '${validatedData.licenceNumber}' is already in use by another driver`,
          409,
          'DUPLICATE_LICENCE'
        );
      }
    }

    const updates: Record<string, any> = {
      updated_at: nowISO(),
    };
    if (validatedData.name) updates.name = validatedData.name.trim();
    if (validatedData.email !== undefined) updates.email = validatedData.email?.trim().toLowerCase();
    if (validatedData.phone) updates.phone = validatedData.phone.trim();
    if (validatedData.licenceNumber) updates.licence_number = validatedData.licenceNumber.trim().toUpperCase();
    if (validatedData.status) updates.status = validatedData.status;

    const { data: updated, error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('driver_id', driverId)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');

    const updatedDoc = mapDriver(updated);

    await writeAuditLog({
      actorId: req.user!.uid,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'driver.updated',
      affectedCollection: 'drivers',
      affectedDocId: driverId,
      before: beforeData as unknown as Record<string, unknown>,
      after: updatedDoc as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.json(successResponse(updatedDoc, 'Driver updated successfully'));
  })
);

// DELETE /api/v1/drivers/:driverId (soft delete)
router.delete(
  '/:driverId',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { driverId } = req.params;

    const { data: existing } = await supabase
      .from('drivers')
      .select('*')
      .eq('driver_id', driverId)
      .single();

    if (!existing) throw new AppError(`Driver with ID '${driverId}' not found`, 404, 'DRIVER_NOT_FOUND');

    const beforeData = mapDriver(existing);
    const updates = {
      status: 'inactive',
      updated_at: nowISO(),
    };

    await supabase.from('drivers').update(updates).eq('driver_id', driverId);

    // Unassign any bus
    if (existing.assigned_bus_id) {
      await supabase.from('buses').update({ driver_id: null, updated_at: nowISO() }).eq('bus_id', existing.assigned_bus_id);
    }

    await writeAuditLog({
      actorId: req.user!.uid,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'driver.deleted',
      affectedCollection: 'drivers',
      affectedDocId: driverId,
      before: beforeData as unknown as Record<string, unknown>,
      after: { ...beforeData, status: 'inactive' },
      ipAddress: req.ip,
    });

    res.json(successResponse({ driverId, status: 'inactive' }, 'Driver deactivated successfully'));
  })
);

// POST /api/v1/drivers/:driverId/assign-bus
router.post(
  '/:driverId/assign-bus',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { driverId } = req.params;
    const { busId } = assignDriverSchema.parse(req.body);

    const { data: driver } = await supabase.from('drivers').select('*').eq('driver_id', driverId).single();
    if (!driver) throw new AppError(`Driver with ID '${driverId}' not found`, 404, 'DRIVER_NOT_FOUND');

    const { data: bus } = await supabase.from('buses').select('*').eq('bus_id', busId).single();
    if (!bus) throw new AppError(`Bus with ID '${busId}' not found`, 404, 'BUS_NOT_FOUND');

    // Clear previous assignments
    if (driver.assigned_bus_id && driver.assigned_bus_id !== busId) {
      await supabase.from('buses').update({ driver_id: null, updated_at: nowISO() }).eq('bus_id', driver.assigned_bus_id);
    }
    if (bus.driver_id && bus.driver_id !== driverId) {
      await supabase.from('drivers').update({ assigned_bus_id: null, updated_at: nowISO() }).eq('driver_id', bus.driver_id);
    }

    await supabase.from('drivers').update({ assigned_bus_id: busId, updated_at: nowISO() }).eq('driver_id', driverId);
    await supabase.from('buses').update({ driver_id: driverId, updated_at: nowISO() }).eq('bus_id', busId);

    res.json(successResponse({ driverId, busId }, `Driver '${driver.name}' assigned to bus '${bus.bus_number}'`));
  })
);

// POST /api/v1/drivers/:driverId/unassign-bus
router.post(
  '/:driverId/unassign-bus',
  verifyFirebaseToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { driverId } = req.params;

    const { data: driver } = await supabase.from('drivers').select('*').eq('driver_id', driverId).single();
    if (!driver) throw new AppError(`Driver with ID '${driverId}' not found`, 404, 'DRIVER_NOT_FOUND');

    const prevBusId = driver.assigned_bus_id;

    await supabase.from('drivers').update({ assigned_bus_id: null, updated_at: nowISO() }).eq('driver_id', driverId);

    if (prevBusId) {
      await supabase.from('buses').update({ driver_id: null, updated_at: nowISO() }).eq('bus_id', prevBusId);
    }

    res.json(successResponse({ driverId, unassignedBusId: prevBusId }, `Driver '${driver.name}' unassigned from bus`));
  })
);

export default router;
