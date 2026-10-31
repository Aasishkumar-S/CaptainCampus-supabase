import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { GPS_STALE_THRESHOLD_MS } from '@captain-campus/shared_types';
import type { LiveLocation, Route, Stop } from '@captain-campus/shared_types';
import { useBus } from '@/hooks/useBuses';
import { useRoute } from '@/hooks/useRoutes';
import { useDriver } from '@/hooks/useDrivers';
import { useTrips } from '@/hooks/useTrips';
import { useStops } from '@/hooks/useStops';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  ArrowLeft,
  Bus as BusIcon,
  Navigation,
  Compass,
  Radio,
  Clock,
  Gauge,
  User,
  Route as RouteIcon,
  AlertTriangle,
  History,
  ShieldCheck,
  MapPin,
  Cpu,
} from 'lucide-react';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const bluePinSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 34 46">
  <path d="M17 2 C8.7 2 2 8.7 2 17 C2 27.5 17 44 17 44 C17 44 32 27.5 32 17 C32 8.7 25.3 2 17 2 Z" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
  <circle cx="17" cy="17" r="6" fill="#ffffff"/>
</svg>
`)}`;

const amberPinSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 34 46">
  <path d="M17 2 C8.7 2 2 8.7 2 17 C2 27.5 17 44 17 44 C17 44 32 27.5 32 17 C32 8.7 25.3 2 17 2 Z" fill="#f59e0b" stroke="#ffffff" stroke-width="2"/>
  <circle cx="17" cy="17" r="6" fill="#ffffff"/>
</svg>
`)}`;

const stopPinSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="10" fill="#4f46e5" stroke="#ffffff" stroke-width="2"/>
</svg>
`)}`;

export const BusDetailPage: React.FC = () => {
  const { busId = '' } = useParams<{ busId: string }>();
  const navigate = useNavigate();

  const { data: bus, isLoading: isBusLoading } = useBus(busId);
  const { data: assignedRoute } = useRoute(bus?.currentRouteId || '');
  const { data: assignedDriver } = useDriver(bus?.driverId || '');
  const { data: busTrips = [], isLoading: isTripsLoading } = useTrips({ busId });
  const { data: allStops = [] } = useStops();

  const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const stopMarkersRef = useRef<google.maps.Marker[]>([]);

  // 1. Subscribe to Supabase live location for this bus
  useEffect(() => {
    if (!busId) return;

    // Initial fetch
    supabase
      .from('live_locations')
      .select('*')
      .eq('bus_id', busId)
      .single()
      .then(({ data }) => {
        if (data) {
          setLiveLocation({
            busId: data.bus_id,
            tripId: data.trip_id,
            latitude: data.latitude,
            longitude: data.longitude,
            speed: data.speed,
            heading: data.heading,
            accuracy: data.accuracy,
            altitude: data.altitude,
            source: data.source,
            deviceId: data.device_id,
            timestamp: Number(data.timestamp),
            serverTimestamp: data.server_timestamp ? Number(data.server_timestamp) : undefined,
          });
        } else {
          setLiveLocation(null);
        }
      });

    // Realtime channel
    const channel = supabase
      .channel(`bus-detail-${busId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_locations', filter: `bus_id=eq.${busId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setLiveLocation(null);
          } else if (payload.new) {
            const row = payload.new as any;
            setLiveLocation({
              busId: row.bus_id,
              tripId: row.trip_id,
              latitude: row.latitude,
              longitude: row.longitude,
              speed: row.speed,
              heading: row.heading,
              accuracy: row.accuracy,
              altitude: row.altitude,
              source: row.source,
              deviceId: row.device_id,
              timestamp: Number(row.timestamp),
              serverTimestamp: row.server_timestamp ? Number(row.server_timestamp) : undefined,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [busId]);

  // Compute telemetry staleness
  const telemetryStatus = useMemo(() => {
    if (!liveLocation) return { label: 'Offline', color: 'neutral' as const, isStale: true };
    const ageMs = Date.now() - liveLocation.timestamp;
    if (ageMs > GPS_STALE_THRESHOLD_MS) {
      return { label: 'Stale (>3m)', color: 'warning' as const, isStale: true };
    }
    return { label: 'Live Telemetry', color: 'success' as const, isStale: false };
  }, [liveLocation]);

  // 2. Load Google Maps script
  useEffect(() => {
    if (!MAPS_API_KEY) {
      setMapError('MISSING_KEY');
      return;
    }

    if (window.google?.maps) {
      setMapReady(true);
      return;
    }

    const scriptId = 'google-maps-script';
    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      existingScript.addEventListener('load', () => setMapReady(true));
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapReady(true);
    script.onerror = () => setMapError('LOAD_FAILED');
    document.head.appendChild(script);
  }, []);

  // 3. Initialize Map
  useEffect(() => {
    if (!mapReady || !mapRef.current || mapInstanceRef.current) return;

    const initialPos = liveLocation
      ? { lat: liveLocation.latitude, lng: liveLocation.longitude }
      : { lat: 12.9716, lng: 77.5946 };

    const map = new google.maps.Map(mapRef.current, {
      center: initialPos,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });

    mapInstanceRef.current = map;
  }, [mapReady, liveLocation]);

  // 4. Update Bus Marker on location change
  useEffect(() => {
    if (!mapInstanceRef.current || !liveLocation) return;

    const pos = { lat: liveLocation.latitude, lng: liveLocation.longitude };

    const iconUrl = telemetryStatus.isStale ? amberPinSvg : bluePinSvg;

    if (!markerRef.current) {
      markerRef.current = new google.maps.Marker({
        position: pos,
        map: mapInstanceRef.current,
        title: bus?.busNumber || busId,
        icon: {
          url: iconUrl,
          scaledSize: new google.maps.Size(32, 42),
          anchor: new google.maps.Point(16, 42),
        },
      });
      mapInstanceRef.current.panTo(pos);
    } else {
      markerRef.current.setPosition(pos);
      markerRef.current.setIcon({
        url: iconUrl,
        scaledSize: new google.maps.Size(32, 42),
        anchor: new google.maps.Point(16, 42),
      });
    }
  }, [liveLocation, telemetryStatus.isStale, bus?.busNumber, busId]);

  // 5. Draw Route Polyline & Stop Markers if route is assigned
  useEffect(() => {
    if (!mapInstanceRef.current || !assignedRoute || allStops.length === 0) return;

    // Clear previous
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }
    stopMarkersRef.current.forEach((m) => m.setMap(null));
    stopMarkersRef.current = [];

    const stopMap = new Map(allStops.map((s) => [s.stopId, s]));
    const path: google.maps.LatLngLiteral[] = [];

    assignedRoute.stopSequence
      .sort((a, b) => a.sequence - b.sequence)
      .forEach((entry) => {
        const stop = stopMap.get(entry.stopId);
        if (stop) {
          const pt = { lat: stop.latitude, lng: stop.longitude };
          path.push(pt);

          const sm = new google.maps.Marker({
            position: pt,
            map: mapInstanceRef.current,
            title: `${entry.sequence}. ${stop.name}`,
            label: {
              text: `${entry.sequence}`,
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 'bold',
            },
            icon: {
              url: stopPinSvg,
              scaledSize: new google.maps.Size(20, 20),
              anchor: new google.maps.Point(10, 10),
            },
          });
          stopMarkersRef.current.push(sm);
        }
      });

    if (path.length > 1) {
      polylineRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: assignedRoute.color || '#4f46e5',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: mapInstanceRef.current,
      });
    }
  }, [assignedRoute, allStops]);

  if (isBusLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!bus) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/buses')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Buses
        </Button>
        <Card>
          <CardContent className="p-8 text-center text-slate-500 dark:text-slate-400">
            Bus not found or has been decommissioned.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/buses')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Buses
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {bus.busNumber}
              </h2>
              <Badge
                variant={
                  bus.status === 'active'
                    ? 'success'
                    : bus.status === 'maintenance'
                    ? 'warning'
                    : 'neutral'
                }
              >
                {bus.status.toUpperCase()}
              </Badge>
              <Badge variant={telemetryStatus.color}>
                <Radio className="w-3 h-3 mr-1 animate-pulse" />
                {telemetryStatus.label}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Plate: {bus.registrationNumber} &bull; Capacity: {bus.capacity} seats
            </p>
          </div>
        </div>

        {liveLocation?.source === 'simulator' && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            [SIMULATED LIVE TELEMETRY]
          </div>
        )}
      </div>

      {/* Telemetry Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current Speed"
          value={
            liveLocation?.speed !== undefined
              ? `${liveLocation.speed.toFixed(1)} km/h`
              : '0.0 km/h'
          }
          icon={<Gauge className="w-5 h-5 text-indigo-500" />}
          color="indigo"
        />
        <StatCard
          title="Compass Heading"
          value={
            liveLocation?.heading !== undefined
              ? `${Math.round(liveLocation.heading)}°`
              : 'N/A'
          }
          icon={<Compass className="w-5 h-5 text-emerald-500" />}
          color="emerald"
        />
        <StatCard
          title="Live Coordinates"
          value={
            liveLocation
              ? `${liveLocation.latitude.toFixed(4)}, ${liveLocation.longitude.toFixed(4)}`
              : 'Awaiting Fix'
          }
          icon={<MapPin className="w-5 h-5 text-blue-500" />}
          color="blue"
        />
        <StatCard
          title="Last Fix Timestamp"
          value={
            liveLocation
              ? new Date(liveLocation.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
              : 'Never'
          }
          icon={<Clock className="w-5 h-5 text-amber-500" />}
          color="amber"
        />
      </div>

      {/* Main Grid: Live Map + Vehicle Spec & Driver */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Telemetry Map (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Navigation className="w-4 h-4 text-indigo-500" />
                Live Vehicle Position & Route Map
              </CardTitle>
              {liveLocation && (
                <span className="text-xs text-slate-500">
                  Accuracy: &plusmn;{liveLocation.accuracy ? `${Math.round(liveLocation.accuracy)}m` : '5m'}
                </span>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {mapError === 'MISSING_KEY' ? (
                <div className="h-96 flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-900">
                  <AlertTriangle className="w-10 h-10 text-amber-500 mb-2" />
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Google Maps API Key Missing
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Configure VITE_GOOGLE_MAPS_API_KEY in your .env file to enable live satellite and vector tracking.
                  </p>
                </div>
              ) : (
                <div className="relative h-96 w-full">
                  <div ref={mapRef} className="h-full w-full" />
                  {!mapReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 bg-opacity-75">
                      <LoadingSpinner size="md" />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trip History for this Bus */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-500" />
                Trip History & Schedules
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isTripsLoading ? (
                <div className="py-8 flex justify-center">
                  <LoadingSpinner size="md" />
                </div>
              ) : busTrips.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">
                  No trips logged for this vehicle yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Trip ID</th>
                        <th className="px-4 py-3 font-semibold">Scheduled Start</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Delay</th>
                        <th className="px-4 py-3 font-semibold">Actual Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {busTrips.slice(0, 5).map((trip) => (
                        <tr key={trip.tripId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                            {trip.tripId}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                            {new Date(trip.scheduledStart).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                trip.status === 'in_progress'
                                  ? 'success'
                                  : trip.status === 'delayed'
                                  ? 'warning'
                                  : trip.status === 'completed'
                                  ? 'info'
                                  : 'neutral'
                              }
                            >
                              {trip.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                            {trip.delayMinutes ? `+${trip.delayMinutes} min` : 'On Time'}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {trip.actualStart
                              ? `${new Date(trip.actualStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Vehicle Info, Driver Info, Assigned Route */}
        <div className="space-y-6">
          {/* Vehicle Specifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BusIcon className="w-4 h-4 text-indigo-500" />
                Vehicle Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Bus Number</span>
                <span className="font-medium text-slate-900 dark:text-white">{bus.busNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Registration Plate</span>
                <span className="font-medium text-slate-900 dark:text-white">{bus.registrationNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Make / Model</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {bus.make || 'Tata'} {bus.model || 'Starbus'} {bus.year ? `(${bus.year})` : ''}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Passenger Capacity</span>
                <span className="font-medium text-slate-900 dark:text-white">{bus.capacity} seats</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5" /> GPS Device ID
                </span>
                <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400">
                  {bus.gpsDeviceId || 'SIM-DEVICE-01'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Driver */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" />
                Assigned Driver
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {assignedDriver ? (
                <>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Driver Name</span>
                    <span className="font-medium text-slate-900 dark:text-white">{assignedDriver.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Contact Phone</span>
                    <span className="font-medium text-slate-900 dark:text-white">{assignedDriver.phone}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Driver License</span>
                    <span className="font-medium text-slate-900 dark:text-white">{assignedDriver.licenceNumber}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Driver Status</span>
                    <Badge variant={assignedDriver.status === 'active' ? 'success' : 'neutral'}>
                      {assignedDriver.status.toUpperCase()}
                    </Badge>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500 py-2">No driver currently assigned to this vehicle.</p>
              )}
            </CardContent>
          </Card>

          {/* Assigned Route */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <RouteIcon className="w-4 h-4 text-indigo-500" />
                Assigned Route
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {assignedRoute ? (
                <>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Route Code</span>
                    <Badge variant="info">{assignedRoute.routeCode}</Badge>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Route Name</span>
                    <span className="font-medium text-slate-900 dark:text-white">{assignedRoute.routeName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Direction</span>
                    <span className="capitalize text-slate-700 dark:text-slate-300">{assignedRoute.direction}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Stops Count</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {assignedRoute.stopSequence.length} stops
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Est. Duration</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {assignedRoute.estimatedDuration || 20} min
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500 py-2">No active route assigned to this vehicle.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
