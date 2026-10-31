import { supabase } from '../config/supabase';
import { ALL_SIM_ROUTES, ALL_SIM_STOPS } from './routeData';

/**
 * Main seed function for Supabase
 */
async function seed(): Promise<void> {
  const isClearOnly = process.argv.includes('--clear');
  const now = new Date().toISOString();
  const insertOrThrow = async (
    table: string,
    operation: PromiseLike<{ error: { message: string } | null }>
  ): Promise<void> => {
    const { error } = await operation;
    if (error) {
      throw new Error(`${table} insert failed: ${error.message}`);
    }
  };

  console.log('===========================================================');
  console.log('  Captain Campus Supabase Database Seeder');
  console.log(`  Target: ${process.env.SUPABASE_URL || 'Local / Configured Supabase'}`);
  console.log(`  Mode: ${isClearOnly ? 'CLEAR ONLY' : 'SEED (with reset)'}`);
  console.log('===========================================================\n');

  const { error: connectionError } = await supabase.from('buses').select('bus_id').limit(1);
  if (connectionError) {
    throw new Error(`Supabase connection check failed: ${connectionError.message}`);
  }

  console.log('Clearing existing tables in reverse dependency order...');
  await supabase.from('trips').delete().neq('trip_id', '_none_');
  await supabase.from('route_stops').delete().neq('route_id', '_none_');
  await supabase.from('routes').delete().neq('route_id', '_none_');
  await supabase.from('buses').delete().neq('bus_id', '_none_');
  await supabase.from('drivers').delete().neq('driver_id', '_none_');
  await supabase.from('stops').delete().neq('stop_id', '_none_');
  await supabase.from('gps_devices').delete().neq('device_id', '_none_');
  await supabase.from('announcements').delete().neq('announcement_id', '_none_');
  console.log('  - Tables cleared.');

  if (isClearOnly) {
    console.log('\n[SUCCESS] Tables cleared successfully. Exiting.');
    process.exit(0);
  }

  console.log('\nBeginning database seed...');

  // 1. Seed Stops
  console.log(`Seeding ${ALL_SIM_STOPS.length} stops...`);
  const stopsData = ALL_SIM_STOPS.map((s) => ({
    stop_id: s.stopId,
    name: s.name,
    latitude: s.latitude,
    longitude: s.longitude,
    created_at: now,
  }));
  await insertOrThrow('stops', supabase.from('stops').insert(stopsData));

  // 2. Seed Routes
  console.log(`Seeding ${ALL_SIM_ROUTES.length} routes...`);
  const routesData = ALL_SIM_ROUTES.map((r) => ({
    route_id: r.routeId,
    route_code: r.routeCode,
    route_name: r.routeName,
    direction: r.direction,
    color: r.color,
    estimated_duration: r.estimatedDuration,
    active: true,
    created_at: now,
    updated_at: now,
  }));
  await insertOrThrow('routes', supabase.from('routes').insert(routesData));

  // 2b. Seed Route Stops junction
  const routeStopsData: {
    route_id: string;
    stop_id: string;
    sequence: number;
    arrival_offset_minutes: number;
  }[] = [];
  ALL_SIM_ROUTES.forEach((r) => {
    const routeStopIds = new Set<string>();
    r.stops.forEach((s, idx) => {
      if (routeStopIds.has(s.stopId)) {
        return;
      }
      routeStopIds.add(s.stopId);
      routeStopsData.push({
        route_id: r.routeId,
        stop_id: s.stopId,
        sequence: idx + 1,
        arrival_offset_minutes: idx * 3,
      });
    });
  });
  await insertOrThrow('route_stops', supabase.from('route_stops').insert(routeStopsData));

  // 3. Seed Drivers
  console.log('Seeding 3 drivers...');
  const driversData = [
    {
      driver_id: 'driver-001',
      name: 'Rajesh Kumar',
      phone: '9876543210',
      licence_number: 'DL-1234567890',
      status: 'active',
      assigned_bus_id: 'bus-cc-01',
      created_at: now,
      updated_at: now,
    },
    {
      driver_id: 'driver-002',
      name: 'Suresh Patel',
      phone: '9876543211',
      licence_number: 'DL-0987654321',
      status: 'active',
      assigned_bus_id: 'bus-cc-02',
      created_at: now,
      updated_at: now,
    },
    {
      driver_id: 'driver-003',
      name: 'Mohan Das',
      phone: '9876543212',
      licence_number: 'DL-1122334455',
      status: 'active',
      assigned_bus_id: 'bus-cc-03',
      created_at: now,
      updated_at: now,
    },
  ];
  await insertOrThrow('drivers', supabase.from('drivers').insert(driversData));

  // 4. Seed GPS Devices
  console.log('Seeding 4 GPS devices...');
  const gpsDevicesData = [
    { device_id: 'SIM-DEVICE-01', bus_id: 'bus-cc-01', status: 'online', created_at: now, updated_at: now },
    { device_id: 'SIM-DEVICE-02', bus_id: 'bus-cc-02', status: 'online', created_at: now, updated_at: now },
    { device_id: 'SIM-DEVICE-03', bus_id: 'bus-cc-03', status: 'online', created_at: now, updated_at: now },
    { device_id: 'SIM-DEVICE-04', bus_id: 'bus-cc-04', status: 'online', created_at: now, updated_at: now },
  ];
  await insertOrThrow('gps_devices', supabase.from('gps_devices').insert(gpsDevicesData));

  // 5. Seed Buses
  console.log('Seeding 4 buses...');
  const busesData = [
    {
      bus_id: 'bus-cc-01',
      bus_number: 'CC-01',
      registration_number: 'KA01AA0001',
      capacity: 45,
      driver_id: 'driver-001',
      gps_device_id: 'SIM-DEVICE-01',
      current_route_id: 'route-r1',
      current_trip_id: 'trip-001',
      status: 'active',
      created_at: now,
      updated_at: now,
    },
    {
      bus_id: 'bus-cc-02',
      bus_number: 'CC-02',
      registration_number: 'KA01AA0002',
      capacity: 45,
      driver_id: 'driver-002',
      gps_device_id: 'SIM-DEVICE-02',
      current_route_id: 'route-r1',
      status: 'active',
      created_at: now,
      updated_at: now,
    },
    {
      bus_id: 'bus-cc-03',
      bus_number: 'CC-03',
      registration_number: 'KA01AA0003',
      capacity: 40,
      driver_id: 'driver-003',
      gps_device_id: 'SIM-DEVICE-03',
      current_route_id: 'route-r2',
      current_trip_id: 'trip-002',
      status: 'active',
      created_at: now,
      updated_at: now,
    },
    {
      bus_id: 'bus-cc-04',
      bus_number: 'CC-04',
      registration_number: 'KA01AA0004',
      capacity: 35,
      gps_device_id: 'SIM-DEVICE-04',
      current_route_id: 'route-r3',
      status: 'active',
      created_at: now,
      updated_at: now,
    },
  ];
  await insertOrThrow('buses', supabase.from('buses').insert(busesData));

  // 6. Seed Trips
  console.log('Seeding 2 active trips...');
  const tripsData = [
    {
      trip_id: 'trip-001',
      bus_id: 'bus-cc-01',
      driver_id: 'driver-001',
      route_id: 'route-r1',
      scheduled_start: now,
      actual_start: now,
      status: 'in_progress',
      created_at: now,
      updated_at: now,
    },
    {
      trip_id: 'trip-002',
      bus_id: 'bus-cc-03',
      driver_id: 'driver-003',
      route_id: 'route-r2',
      scheduled_start: now,
      actual_start: now,
      status: 'in_progress',
      created_at: now,
      updated_at: now,
    },
  ];
  await insertOrThrow('trips', supabase.from('trips').insert(tripsData));

  // 7. Seed Sample Announcement
  console.log('Seeding 1 sample announcement...');
  await insertOrThrow('announcements', supabase.from('announcements').insert({
    announcement_id: 'announcement-001',
    title: 'Route R3 Running Late Today',
    message: 'Express Route R3 is currently experiencing moderate campus traffic delays. Expect an additional 5-10 minute wait.',
    severity: 'warning',
    route_id: 'route-r3',
    created_by: 'admin-seed',
    created_at: now,
  }));

  console.log('\n===========================================================');
  console.log('  Database Seeding Summary');
  console.log('===========================================================');
  console.table([
    { Table: 'stops', Count: ALL_SIM_STOPS.length, Details: '20 deduplicated stops across campus' },
    { Table: 'routes', Count: ALL_SIM_ROUTES.length, Details: 'R1 (Inbound), R2 (Circular), R3 (Outbound)' },
    { Table: 'route_stops', Count: routeStopsData.length, Details: 'Stop sequences for R1, R2, R3' },
    { Table: 'buses', Count: busesData.length, Details: 'CC-01, CC-02, CC-03, CC-04' },
    { Table: 'drivers', Count: driversData.length, Details: 'Rajesh Kumar, Suresh Patel, Mohan Das' },
    { Table: 'gps_devices', Count: gpsDevicesData.length, Details: 'SIM-DEVICE-01 through SIM-DEVICE-04' },
    { Table: 'trips', Count: tripsData.length, Details: 'trip-001 (CC-01/R1), trip-002 (CC-03/R2)' },
    { Table: 'announcements', Count: 1, Details: 'Route R3 Delay Warning' },
  ]);
  console.log('===========================================================');
  console.log('  Supabase Seed completed successfully!');
  console.log('===========================================================\n');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error during seeding:', err);
    process.exit(1);
  });
