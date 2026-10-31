export type AuditAction =
  | 'user.created' | 'user.updated' | 'user.role_changed' | 'user.disabled'
  | 'bus.created' | 'bus.updated' | 'bus.deleted' | 'bus.status_changed'
  | 'driver.created' | 'driver.updated' | 'driver.assigned'
  | 'route.created' | 'route.updated' | 'route.published' | 'route.deleted'
  | 'stop.created' | 'stop.updated' | 'stop.deleted'
  | 'trip.started' | 'trip.ended' | 'trip.cancelled'
  | 'announcement.published' | 'announcement.cancelled'
  | 'gps_device.registered' | 'gps_device.assigned' | 'gps_device.deactivated'
  | 'admin.login' | 'admin.logout';

export interface AuditLog {
  logId: string;
  actorId: string;
  actorEmail?: string;
  actorRole?: string;
  action: AuditAction;
  affectedCollection: string;
  affectedDocId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;  // ISO 8601
}
