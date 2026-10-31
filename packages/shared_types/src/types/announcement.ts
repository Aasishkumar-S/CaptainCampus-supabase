export type AnnouncementStatus = 'draft' | 'published' | 'expired' | 'cancelled';
export type AnnouncementSeverity = 'info' | 'warning' | 'critical';

export interface Announcement {
  announcementId: string;
  title: string;
  message: string;
  severity: AnnouncementSeverity;
  affectedRouteIds: string[];
  affectedStopIds?: string[];
  affectedBusIds?: string[];
  createdBy: string;         // admin userId
  createdAt: string;
  publishAt?: string;        // scheduled publish time
  expiresAt?: string;
  status: AnnouncementStatus;
  fcmSent: boolean;
  fcmSentAt?: string;
}
