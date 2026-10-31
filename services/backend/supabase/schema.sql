-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- BUSES
-- =============================================
CREATE TABLE IF NOT EXISTS buses (
  bus_id TEXT PRIMARY KEY,
  bus_number TEXT NOT NULL UNIQUE,
  registration_number TEXT NOT NULL UNIQUE,
  capacity INTEGER NOT NULL DEFAULT 40,
  make TEXT,
  model TEXT,
  year INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'decommissioned')),
  current_route_id TEXT,
  current_trip_id TEXT,
  driver_id TEXT,
  gps_device_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- DRIVERS
-- =============================================
CREATE TABLE IF NOT EXISTS drivers (
  driver_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  licence_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  assigned_bus_id TEXT,
  profile_photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ROUTES
-- =============================================
CREATE TABLE IF NOT EXISTS routes (
  route_id TEXT PRIMARY KEY,
  route_code TEXT NOT NULL UNIQUE,
  route_name TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('outbound', 'inbound', 'circular')),
  color TEXT DEFAULT '#4f46e5',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  estimated_duration INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- STOPS
-- =============================================
CREATE TABLE IF NOT EXISTS stops (
  stop_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  landmark TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ROUTE_STOPS (junction table with sequence)
-- =============================================
CREATE TABLE IF NOT EXISTS route_stops (
  route_id TEXT NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
  stop_id TEXT NOT NULL REFERENCES stops(stop_id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  arrival_offset_minutes INTEGER DEFAULT 0,
  PRIMARY KEY (route_id, stop_id)
);

-- =============================================
-- TRIPS
-- =============================================
CREATE TABLE IF NOT EXISTS trips (
  trip_id TEXT PRIMARY KEY,
  bus_id TEXT NOT NULL REFERENCES buses(bus_id),
  route_id TEXT NOT NULL REFERENCES routes(route_id),
  driver_id TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'delayed')),
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  delay_minutes INTEGER DEFAULT 0,
  passenger_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ANNOUNCEMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS announcements (
  announcement_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  route_id TEXT,
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'route', 'admin')),
  created_by TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- LIVE_LOCATIONS (GPS telemetry - Supabase Realtime table)
-- =============================================
CREATE TABLE IF NOT EXISTS live_locations (
  bus_id TEXT PRIMARY KEY,
  trip_id TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  speed DOUBLE PRECISION DEFAULT 0,
  heading DOUBLE PRECISION DEFAULT 0,
  accuracy DOUBLE PRECISION,
  altitude DOUBLE PRECISION,
  source TEXT DEFAULT 'gps' CHECK (source IN ('gps', 'simulator', 'manual')),
  device_id TEXT,
  timestamp BIGINT NOT NULL,
  server_timestamp BIGINT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- GPS_DEVICES
-- =============================================
CREATE TABLE IF NOT EXISTS gps_devices (
  device_id TEXT PRIMARY KEY,
  bus_id TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'stale')),
  last_seen_at BIGINT,
  firmware_version TEXT,
  battery_level INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- USER_PROFILES (extends Supabase Auth users)
-- =============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY,
  name TEXT,
  email TEXT,
  student_id TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'driver')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  preferred_stop_id TEXT,
  fcm_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- NOTIFICATIONS LOG
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  route_id TEXT,
  announcement_id TEXT,
  recipient_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- AUDIT_LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  actor_id TEXT NOT NULL,
  actor_email TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  affected_table TEXT,
  affected_row_id TEXT,
  before_data JSONB,
  after_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_buses_status ON buses(status);
CREATE INDEX IF NOT EXISTS idx_buses_current_route ON buses(current_route_id);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_bus_id ON trips(bus_id);
CREATE INDEX IF NOT EXISTS idx_trips_route_id ON trips(route_id);
CREATE INDEX IF NOT EXISTS idx_trips_scheduled_start ON trips(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_route_stops_route_id ON route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_sequence ON route_stops(sequence);
CREATE INDEX IF NOT EXISTS idx_live_locations_updated ON live_locations(updated_at);

-- =============================================
-- ENABLE REALTIME for live_locations
-- (Run this in Supabase Dashboard > Database > Replication)
-- =============================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE live_locations;
-- ALTER PUBLICATION supabase_realtime ADD TABLE announcements;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read public data
CREATE POLICY "Authenticated users can read buses" ON buses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read routes" ON routes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read stops" ON stops FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read route_stops" ON route_stops FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read live_locations" ON live_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read announcements" ON announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read trips" ON trips FOR SELECT TO authenticated USING (true);

-- Service role (backend) bypasses RLS automatically
-- No additional policies needed for backend operations
