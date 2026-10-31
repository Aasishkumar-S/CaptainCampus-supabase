import { BusStatus } from '../types/bus';
import { DriverStatus } from '../types/driver';
import { RouteDirection, RouteStatus, StopSequenceEntry } from '../types/route';
import { StopStatus } from '../types/stop';
import { TripStatus } from '../types/trip';
import { LocationSource } from '../types/liveLocation';
import { AnnouncementSeverity, AnnouncementStatus } from '../types/announcement';
import { NotificationPreferences } from '../types/user';
import { GpsDeviceStatus, GpsDeviceType } from '../types/gpsDevice';

/**
 * Payload to create a new Bus in the fleet.
 */
export interface CreateBusRequest {
  busNumber: string;
  registrationNumber: string;
  capacity: number;
  driverId?: string;
  gpsDeviceId?: string;
  currentRouteId?: string;
  make?: string;
  model?: string;
  year?: number;
  status?: BusStatus;
}

/**
 * Payload to update existing Bus attributes.
 */
export interface UpdateBusRequest {
  busNumber?: string;
  registrationNumber?: string;
  capacity?: number;
  driverId?: string | null;
  gpsDeviceId?: string | null;
  currentRouteId?: string | null;
  currentTripId?: string | null;
  status?: BusStatus;
  make?: string;
  model?: string;
  year?: number;
}

/**
 * Payload to register a new Driver.
 */
export interface CreateDriverRequest {
  name: string;
  phone: string;
  email?: string;
  licenceNumber: string;
  licenceExpiry: string; // ISO 8601 date string
  employeeId?: string;
  status?: DriverStatus;
  currentBusId?: string;
}

/**
 * Payload to update an existing Driver's details.
 */
export interface UpdateDriverRequest {
  name?: string;
  phone?: string;
  email?: string;
  licenceNumber?: string;
  licenceExpiry?: string;
  employeeId?: string;
  status?: DriverStatus;
  currentBusId?: string | null;
  currentTripId?: string | null;
}

/**
 * Payload to create a transit Route.
 */
export interface CreateRouteRequest {
  routeCode: string;
  routeName: string;
  direction: RouteDirection;
  originStopId: string;
  destinationStopId: string;
  stopSequence: StopSequenceEntry[];
  operatingDays: string[];
  firstDeparture?: string;
  lastDeparture?: string;
  estimatedDuration?: number;
  status?: RouteStatus;
  color?: string;
  description?: string;
}

/**
 * Payload to update a transit Route.
 */
export interface UpdateRouteRequest {
  routeCode?: string;
  routeName?: string;
  direction?: RouteDirection;
  originStopId?: string;
  destinationStopId?: string;
  stopSequence?: StopSequenceEntry[];
  operatingDays?: string[];
  firstDeparture?: string;
  lastDeparture?: string;
  estimatedDuration?: number;
  status?: RouteStatus;
  color?: string;
  description?: string;
}

/**
 * Payload to create a bus Stop.
 */
export interface CreateStopRequest {
  name: string;
  shortName?: string;
  latitude: number;
  longitude: number;
  address?: string;
  description?: string;
  status?: StopStatus;
  facilities?: string[];
}

/**
 * Payload to update a bus Stop.
 */
export interface UpdateStopRequest {
  name?: string;
  shortName?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  description?: string;
  status?: StopStatus;
  facilities?: string[];
}

/**
 * Payload to schedule or create a Trip.
 */
export interface CreateTripRequest {
  busId: string;
  driverId: string;
  routeId: string;
  scheduledStart: string; // ISO 8601
  scheduledEnd?: string;
  notes?: string;
}

/**
 * Payload to update or transition Trip status (e.g., start, end, cancel, delay).
 */
export interface UpdateTripRequest {
  busId?: string;
  driverId?: string;
  routeId?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  status?: TripStatus;
  delayMinutes?: number;
  notes?: string;
}

/**
 * Real-time GPS ingestion payload sent from tracker hardware or mobile driver app.
 */
export interface TelemetryPayload {
  busId: string;
  tripId?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  altitude?: number;
  source: LocationSource;
  deviceId?: string;
  timestamp: number; // Unix ms
}

/**
 * Student request for alternative routes/stops after missing their bus.
 */
export interface MissedBusRequest {
  userId: string;
  missedBusId?: string;
  preferredStopId: string;
  preferredRouteId?: string;
  destinationStopId?: string;
  studentLatitude?: number;
  studentLongitude?: number;
  maxWalkingDistanceMeters?: number;
}

/**
 * Payload to draft or publish a campus transportation Announcement.
 */
export interface CreateAnnouncementRequest {
  title: string;
  message: string;
  severity: AnnouncementSeverity;
  affectedRouteIds: string[];
  affectedStopIds?: string[];
  affectedBusIds?: string[];
  publishAt?: string;
  expiresAt?: string;
  status?: AnnouncementStatus;
  sendPushNotification?: boolean;
}

/**
 * Payload to update general user profile information.
 */
export interface UpdateUserProfileRequest {
  name?: string;
  studentId?: string;
  employeeId?: string;
  phone?: string;
  preferredStopId?: string | null;
  preferredRouteId?: string | null;
  photoUrl?: string;
  fcmToken?: string; // Add/refresh FCM token
  notificationPreferences?: Partial<NotificationPreferences>;
}

/**
 * Payload to update user alert preferences.
 */
export interface UpdateNotificationPrefsRequest {
  busApproaching?: boolean;
  approachingMinutes?: number;
  delays?: boolean;
  cancellations?: boolean;
  routeChanges?: boolean;
  announcements?: boolean;
}

/**
 * Payload to register or update a GPS tracking hardware device.
 */
export interface RegisterGpsDeviceRequest {
  deviceId: string;
  deviceType: GpsDeviceType;
  assignedBusId?: string;
  status?: GpsDeviceStatus;
  firmwareVersion?: string;
  imei?: string;
  description?: string;
}

export interface UpdateGpsDeviceRequest {
  assignedBusId?: string | null;
  status?: GpsDeviceStatus;
  firmwareVersion?: string;
  imei?: string;
  description?: string;
}
