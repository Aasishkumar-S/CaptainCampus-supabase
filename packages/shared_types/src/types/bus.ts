export type BusStatus = 'active' | 'inactive' | 'maintenance' | 'decommissioned';

export interface Bus {
  busId: string;
  busNumber: string;           // display number e.g. "BUS-01"
  registrationNumber: string;  // official plate e.g. "KA01AB1234"
  capacity: number;
  driverId?: string;
  gpsDeviceId?: string;
  currentRouteId?: string;
  currentTripId?: string;
  status: BusStatus;
  make?: string;
  model?: string;
  year?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BusSummary {
  busId: string;
  busNumber: string;
  registrationNumber: string;
  status: BusStatus;
  driverId?: string;
  currentRouteId?: string;
  currentTripId?: string;
}
