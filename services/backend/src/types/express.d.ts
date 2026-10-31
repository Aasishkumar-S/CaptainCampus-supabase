import { DecodedIdToken } from 'firebase-admin/auth';
import { UserRole } from '@captain-campus/shared_types';

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        role?: UserRole;
        decodedToken: DecodedIdToken;
      };
      deviceId?: string;
    }
  }
}

export {};
