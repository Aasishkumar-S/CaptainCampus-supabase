import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@captain-campus/shared_types';
import { AppError } from './errorHandler';

/**
 * Role-Based Access Control middleware factory.
 * Requires that verifyFirebaseToken has already executed.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(
        new AppError('Authentication required to access this resource', 401, 'UNAUTHORIZED')
      );
    }

    const userRole = req.user.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return next(
        new AppError(
          `Forbidden: User role '${userRole || 'none'}' does not have permission. Required one of: ${allowedRoles.join(', ')}`,
          403,
          'FORBIDDEN'
        )
      );
    }

    return next();
  };
}

/**
 * Convenience middleware requiring admin or super_admin role
 */
export const requireAdmin = requireRole('admin', 'super_admin');

/**
 * Convenience middleware requiring super_admin role
 */
export const requireSuperAdmin = requireRole('super_admin');

/**
 * Convenience middleware requiring student role
 */
export const requireStudent = requireRole('student');
