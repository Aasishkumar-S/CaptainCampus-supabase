export type RouteDirection = 'inbound' | 'outbound' | 'circular';
export type RouteStatus = 'active' | 'inactive' | 'suspended';

export interface StopSequenceEntry {
  stopId: string;
  sequence: number;           // 1-indexed order
  scheduledOffset?: number;   // minutes from trip start
  isPickup: boolean;
  isDropoff: boolean;
}

export interface Route {
  routeId: string;
  routeCode: string;          // short code e.g. "R1"
  routeName: string;
  direction: RouteDirection;
  originStopId: string;
  destinationStopId: string;
  stopSequence: StopSequenceEntry[];
  operatingDays: string[];    // e.g. ['MON','TUE','WED','THU','FRI']
  firstDeparture?: string;    // HH:MM
  lastDeparture?: string;     // HH:MM
  estimatedDuration?: number; // minutes
  status: RouteStatus;
  color?: string;             // hex for map polyline
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RouteSummary {
  routeId: string;
  routeCode: string;
  routeName: string;
  direction: RouteDirection;
  status: RouteStatus;
  stopCount: number;
}
