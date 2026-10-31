export type StopStatus = 'active' | 'inactive' | 'temporary';

export interface Stop {
  stopId: string;
  name: string;
  shortName?: string;
  latitude: number;
  longitude: number;
  address?: string;
  description?: string;
  status: StopStatus;
  facilities?: string[];   // e.g. ['shelter', 'bench', 'lighting']
  createdAt: string;
  updatedAt: string;
}

export interface StopWithDistance extends Stop {
  distanceMeters: number;   // from student's location
  walkingMinutes?: number;
}
