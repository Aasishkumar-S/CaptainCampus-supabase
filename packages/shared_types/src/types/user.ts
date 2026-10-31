export type UserRole = 'student' | 'admin' | 'super_admin' | 'driver';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  userId: string;
  name: string;
  email: string;
  studentId?: string;        // for students
  employeeId?: string;       // for staff/admins
  role: UserRole;
  preferredStopId?: string;
  preferredRouteId?: string;
  photoUrl?: string;
  phone?: string;
  status: UserStatus;
  createdAt: string;         // ISO 8601
  updatedAt: string;
  lastLoginAt?: string;
  fcmTokens?: string[];      // multiple devices
  notificationPreferences?: NotificationPreferences;
}

export interface NotificationPreferences {
  busApproaching: boolean;       // bus X min away
  approachingMinutes: number;    // threshold in minutes
  delays: boolean;
  cancellations: boolean;
  routeChanges: boolean;
  announcements: boolean;
}

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  studentId?: string;
  role: UserRole;
  preferredStopId?: string;
  preferredRouteId?: string;
  photoUrl?: string;
  notificationPreferences?: NotificationPreferences;
}
