export type TripStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'delayed';

export interface Trip {
  tripId: string;
  busId: string;
  driverId: string;
  routeId: string;
  scheduledStart: string;   // ISO 8601
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  status: TripStatus;
  delayMinutes?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TripSummary {
  tripId: string;
  busId: string;
  busNumber: string;
  routeId: string;
  routeCode: string;
  routeName: string;
  status: TripStatus;
  scheduledStart: string;
  delayMinutes?: number;
}
