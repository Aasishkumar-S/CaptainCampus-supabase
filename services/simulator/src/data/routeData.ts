export interface SimStop {
  stopId: string;
  name: string;
  latitude: number;
  longitude: number;
  sequence: number;
}

export interface SimRoute {
  routeId: string;
  routeCode: string;
  routeName: string;
  direction: 'inbound' | 'outbound' | 'circular';
  color: string;
  stops: SimStop[];
  estimatedDuration: number; // minutes
}

// Route R1 — "Main Gate to Hostel" (inbound, 8 stops, ~20 min, color #1565C0)
export const ROUTE_R1: SimRoute = {
  routeId: 'route-r1',
  routeCode: 'R1',
  routeName: 'Main Gate to Hostel',
  direction: 'inbound',
  color: '#1565C0',
  estimatedDuration: 20,
  stops: [
    { stopId: 'stop-001', name: 'Main Gate', latitude: 12.9716, longitude: 77.5946, sequence: 1 },
    { stopId: 'stop-002', name: 'Admin Block', latitude: 12.9722, longitude: 77.5952, sequence: 2 },
    { stopId: 'stop-003', name: 'Library', latitude: 12.9728, longitude: 77.5960, sequence: 3 },
    { stopId: 'stop-004', name: 'Science Block', latitude: 12.9735, longitude: 77.5968, sequence: 4 },
    { stopId: 'stop-005', name: 'Sports Ground', latitude: 12.9742, longitude: 77.5975, sequence: 5 },
    { stopId: 'stop-006', name: 'Cafeteria', latitude: 12.9748, longitude: 77.5980, sequence: 6 },
    { stopId: 'stop-007', name: 'Boys Hostel A', latitude: 12.9755, longitude: 77.5988, sequence: 7 },
    { stopId: 'stop-008', name: 'Boys Hostel B', latitude: 12.9762, longitude: 77.5995, sequence: 8 },
  ],
};

// Route R2 — "Campus Circular" (circular, 10 stops, ~25 min, color #2E7D32)
export const ROUTE_R2: SimRoute = {
  routeId: 'route-r2',
  routeCode: 'R2',
  routeName: 'Campus Circular',
  direction: 'circular',
  color: '#2E7D32',
  estimatedDuration: 25,
  stops: [
    { stopId: 'stop-001', name: 'Main Gate', latitude: 12.9716, longitude: 77.5946, sequence: 1 },
    { stopId: 'stop-009', name: 'Medical Centre', latitude: 12.9710, longitude: 77.5955, sequence: 2 },
    { stopId: 'stop-010', name: 'Engineering Block', latitude: 12.9705, longitude: 77.5965, sequence: 3 },
    { stopId: 'stop-011', name: 'Computer Lab', latitude: 12.9700, longitude: 77.5975, sequence: 4 },
    { stopId: 'stop-012', name: 'Girls Hostel', latitude: 12.9695, longitude: 77.5985, sequence: 5 },
    { stopId: 'stop-013', name: 'Staff Quarters', latitude: 12.9700, longitude: 77.5995, sequence: 6 },
    { stopId: 'stop-014', name: 'Workshop', latitude: 12.9710, longitude: 77.6000, sequence: 7 },
    { stopId: 'stop-015', name: 'Auditorium', latitude: 12.9720, longitude: 77.5995, sequence: 8 },
    { stopId: 'stop-016', name: 'Guest House', latitude: 12.9725, longitude: 77.5975, sequence: 9 },
    { stopId: 'stop-001', name: 'Main Gate', latitude: 12.9716, longitude: 77.5946, sequence: 10 },
  ],
};

// Route R3 — "Express: Gate to Academic Block" (outbound, 6 stops, ~12 min, color #F57F17)
export const ROUTE_R3: SimRoute = {
  routeId: 'route-r3',
  routeCode: 'R3',
  routeName: 'Express: Gate to Academic Block',
  direction: 'outbound',
  color: '#F57F17',
  estimatedDuration: 12,
  stops: [
    { stopId: 'stop-001', name: 'Main Gate', latitude: 12.9716, longitude: 77.5946, sequence: 1 },
    { stopId: 'stop-017', name: 'Security Office', latitude: 12.9712, longitude: 77.5938, sequence: 2 },
    { stopId: 'stop-018', name: 'Parking Lot', latitude: 12.9708, longitude: 77.5930, sequence: 3 },
    { stopId: 'stop-002', name: 'Admin Block', latitude: 12.9722, longitude: 77.5952, sequence: 4 },
    { stopId: 'stop-019', name: 'Academic Block A', latitude: 12.9730, longitude: 77.5940, sequence: 5 },
    { stopId: 'stop-020', name: 'Academic Block B', latitude: 12.9738, longitude: 77.5932, sequence: 6 },
  ],
};

export const ALL_SIM_ROUTES: SimRoute[] = [ROUTE_R1, ROUTE_R2, ROUTE_R3];

// Unique stops deduplicated by stopId
const stopMap = new Map<string, SimStop>();
for (const route of ALL_SIM_ROUTES) {
  for (const stop of route.stops) {
    if (!stopMap.has(stop.stopId)) {
      stopMap.set(stop.stopId, {
        stopId: stop.stopId,
        name: stop.name,
        latitude: stop.latitude,
        longitude: stop.longitude,
        sequence: stop.sequence,
      });
    }
  }
}

export const ALL_SIM_STOPS: SimStop[] = Array.from(stopMap.values()).sort((a, b) =>
  a.stopId.localeCompare(b.stopId)
);

export const CAMPUS_CENTER: { lat: number; lng: number } = {
  lat: 12.9725,
  lng: 77.5965,
};
