export type DriverStatus = 'active' | 'inactive' | 'on_leave' | 'suspended';

export interface Driver {
  driverId: string;
  name: string;
  phone: string;
  email?: string;
  licenceNumber: string;
  licenceExpiry: string;    // ISO 8601 date
  employeeId?: string;
  status: DriverStatus;
  currentBusId?: string;
  currentTripId?: string;
  createdAt: string;
  updatedAt: string;
}

// Redacted version for non-admin views
export interface DriverPublic {
  driverId: string;
  name: string;
  status: DriverStatus;
}
