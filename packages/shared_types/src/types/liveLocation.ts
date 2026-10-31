export type LocationSource = 'gps_device' | 'phone_gps' | 'esp32' | 'simulator';

export interface LiveLocation {
  busId: string;
  tripId?: string;
  latitude: number;
  longitude: number;
  speed?: number;           // km/h
  heading?: number;         // degrees 0-360
  accuracy?: number;        // meters
  altitude?: number;        // meters
  source: LocationSource;
  deviceId?: string;
  timestamp: number;        // Unix ms
  serverTimestamp?: number; // set by server on receipt
}

export interface LiveLocationWithStatus extends LiveLocation {
  isStale: boolean;         // true if > configured threshold old
  staleSinceMs?: number;
  busNumber?: string;
  routeId?: string;
  routeCode?: string;
}

export interface ETAResult {
  stopId: string;
  busId: string;
  tripId: string;
  busNumber: string;
  routeCode: string;
  etaMinutes: number | null;
  estimatedArrivalTime: string | null;  // ISO 8601
  isLiveEstimate: boolean;              // false = timetable fallback
  lastLocationUpdate: number;           // Unix ms
  isStale: boolean;
  confidence: 'high' | 'medium' | 'low' | 'unavailable';
  source: 'routes_api' | 'calculated' | 'timetable';
}
