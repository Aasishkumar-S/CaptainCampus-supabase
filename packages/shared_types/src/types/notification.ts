export type NotificationType =
  | 'bus_approaching'
  | 'bus_delayed'
  | 'bus_cancelled'
  | 'route_changed'
  | 'announcement'
  | 'missed_bus_recommendation'
  | 'trip_started'
  | 'trip_ended'
  | 'system';

export interface AppNotification {
  notificationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, string>;  // FCM data payload
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  relatedBusId?: string;
  relatedRouteId?: string;
  relatedStopId?: string;
  relatedTripId?: string;
  relatedAnnouncementId?: string;
}
