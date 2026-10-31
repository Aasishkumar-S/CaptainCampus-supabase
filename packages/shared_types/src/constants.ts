// Stale location threshold: if GPS update is older than this, mark as stale
export const GPS_STALE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes

// How long to wait for same-stop bus before suggesting alternatives
export const MISSED_BUS_WAIT_WINDOW_MINUTES = 15;

// Max walking distance for alternative stop suggestions (meters)
export const MAX_WALKING_DISTANCE_METERS = 800;

// ETA cache TTL (don't recalculate if last calc is recent)
export const ETA_CACHE_TTL_MS = 30 * 1000; // 30 seconds

// GPS simulation interval
export const SIMULATOR_UPDATE_INTERVAL_MS = 5000; // 5 seconds

// Roles
export const ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
  DRIVER: 'driver',
} as const;

// Collections (Firestore)
export const COLLECTIONS = {
  USERS: 'users',
  BUSES: 'buses',
  DRIVERS: 'drivers',
  ROUTES: 'routes',
  STOPS: 'stops',
  TRIPS: 'trips',
  ANNOUNCEMENTS: 'announcements',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOGS: 'auditLogs',
  GPS_DEVICES: 'gpsDevices',
} as const;

// Realtime Database paths
export const RTDB_PATHS = {
  LIVE_LOCATIONS: 'liveLocations',
  BUS_LOCATION: (busId: string) => `liveLocations/${busId}`,
} as const;

// API response codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
} as const;
