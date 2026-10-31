import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from './errorHandler';

/**
 * Verifies Supabase JWT (access token) from Authorization: Bearer <token> header.
 * Fetches user profile from user_profiles table to attach role.
 */
export async function verifyFirebaseToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      new AppError('Authorization header missing or invalid format (Bearer token required)', 401, 'UNAUTHORIZED')
    );
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return next(new AppError('Bearer token is empty', 401, 'UNAUTHORIZED'));
  }

  try {
    // Verify JWT with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return next(new AppError('Invalid or expired access token', 401, 'INVALID_TOKEN'));
    }

    // Fetch user profile for role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, status')
      .eq('user_id', user.id)
      .single();

    const role = profile?.role || user.user_metadata?.role || 'student';
    const status = profile?.status || 'active';

    if (status === 'suspended' || status === 'inactive') {
      return next(
        new AppError('Your account has been suspended or deactivated', 403, 'ACCOUNT_DISABLED')
      );
    }

    req.user = {
      uid: user.id,
      email: user.email || '',
      role,
      decodedToken: user as any,
    };

    return next();
  } catch (error: any) {
    return next(new AppError(error?.message || 'Invalid authentication token', 401, 'INVALID_TOKEN'));
  }
}

/**
 * Optional authentication: validates token if present, proceeds without it if not.
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) return next();

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, status')
        .eq('user_id', user.id)
        .single();

      req.user = {
        uid: user.id,
        email: user.email || '',
        role: profile?.role || user.user_metadata?.role || 'student',
        decodedToken: user as any,
      };
    }
  } catch {
    // Ignore errors for optional auth
  }

  return next();
}

/**
 * Device authentication for GPS telemetry (shared secret via X-Device-Token header).
 */
export async function verifyDeviceToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const deviceToken = (req.headers['x-device-token'] as string) || (req.headers['x-api-key'] as string);
  const deviceIdHeader = req.headers['x-device-id'] as string;

  if (!deviceToken) {
    return next(new AppError('Device authorization token missing (X-Device-Token header)', 401, 'UNAUTHORIZED_DEVICE'));
  }

  const configuredSecret = process.env.GPS_DEVICE_SECRET || 'change_this_to_a_long_random_secret_in_production';

  if (deviceToken === configuredSecret) {
    req.deviceId = deviceIdHeader || 'device_secret_auth';
    return next();
  }

  // Check against gps_devices table
  if (deviceIdHeader) {
    try {
      const { data: device } = await supabase
        .from('gps_devices')
        .select('device_id, status')
        .eq('device_id', deviceIdHeader)
        .single();

      if (device) {
        req.deviceId = deviceIdHeader;
        return next();
      }
    } catch {
      // Continue to error
    }
  }

  return next(new AppError('Invalid device token or unauthorized GPS device', 401, 'INVALID_DEVICE_TOKEN'));
}
