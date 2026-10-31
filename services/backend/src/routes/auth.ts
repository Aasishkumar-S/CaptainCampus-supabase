import { Router, Request, Response } from 'express';
import { supabase, nowISO } from '../config/supabase';
import { verifyFirebaseToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { successResponse } from '../utils/responseHelpers';

const router = Router();

// GET /api/v1/auth/me
router.get(
  '/me',
  verifyFirebaseToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', req.user!.uid)
      .single();

    res.json(
      successResponse({
        uid: req.user!.uid,
        email: req.user!.email,
        role: req.user!.role,
        profile: profile || null,
      })
    );
  })
);

// POST /api/v1/auth/profile
router.post(
  '/profile',
  verifyFirebaseToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { name, studentId, preferredStopId, fcmToken } = req.body;

    const { data: existing } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', req.user!.uid)
      .single();

    const profileData = {
      user_id: req.user!.uid,
      name,
      email: req.user!.email,
      student_id: studentId,
      role: req.user!.role || 'student',
      preferred_stop_id: preferredStopId,
      fcm_token: fcmToken,
      updated_at: nowISO(),
    };

    if (existing) {
      await supabase.from('user_profiles').update(profileData).eq('user_id', req.user!.uid);
    } else {
      await supabase.from('user_profiles').insert({ ...profileData, created_at: nowISO() });
    }

    res.json(successResponse(profileData, 'Profile saved successfully'));
  })
);

export default router;
