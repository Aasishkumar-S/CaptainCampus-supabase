import React, { useEffect, useRef, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { GPS_STALE_THRESHOLD_MS } from '@captain-campus/shared_types';
import type { LiveLocation, Route, Stop, Bus } from '@captain-campus/shared_types';
import { useRoutes } from '@/hooks/useRoutes';
import { useStops } from '@/hooks/useStops';
import { useBuses } from '@/hooks/useBuses';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import {
  Compass,
  Radio,
  RotateCcw,
  AlertTriangle,
  Bus as BusIcon,
  Navigation,
  Key,
} from 'lucide-react';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const CAMPUS_CENTER = { lat: 12.9716, lng: 77.5946 };

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

export const LiveMapPage: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  const [liveLocations, setLiveLocations] = useState<Record<string, LiveLocation>>({});
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const { data: routes = [] } = useRoutes();
  const { data: stops = [] } = useStops();
  const { data: buses = [] } = useBuses();

  const stopMap = useMemo(() => new Map(stops.map((s) => [s.stopId, s])), [stops]);
  const busMap = useMemo(() => new Map(buses.map((b) => [b.busId, b])), [buses]);

  // Check if simulated data watermark should appear
  const isSimulated = useMemo(() => {
    const locations = Object.values(liveLocations);
    return locations.length > 0 && locations.every((loc) => loc.source === 'simulator');
  }, [liveLocations]);

  // 1. Load Google Maps API
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapReady(true);
    script.onerror = () => {
      setMapError('Failed to load Google Maps script.');
    };
    document.head.appendChild(script);
  }, []);

  // 2. Initialize Google Map
  useEffect(() => {
    if (!mapReady || !mapRef.current || map) return;

    try {
      const gMap = new google.maps.Map(mapRef.current, {
        center: CAMPUS_CENTER,
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
        ],
      });
      setMap(gMap);
    } catch (err: unknown) {
      setMapError(err instanceof Error ? err.message : 'Error initializing map');
    }
  }, [mapReady, map]);

  // 3. Listen to Supabase Realtime live_locations
  useEffect(() => {
    // Initial fetch
    supabase
      .from('live_locations')
      .select('*')
      .then(({ data }) => {
        if (data) {
          const locs: Record<string, LiveLocation> = {};
          data.forEach((row: any) => {
            locs[row.bus_id] = {
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
            };
          });
          setLiveLocations(locs);
        }
      });

    // Realtime subscription
    const channel = supabase
      .channel('live-locations-admin-map')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_locations' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setLiveLocations((prev) => {
              const next = { ...prev };
              delete next[(payload.old as any).bus_id];
              return next;
            });
          } else {
            const row = payload.new as any;
            const loc: LiveLocation = {
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
            };
            setLiveLocations((prev) => ({ ...prev, [loc.busId]: loc }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 4. Update Markers on Location Changes
  useEffect(() => {
    if (!map || !window.google?.maps) return;

    const currentBusIds = new Set(Object.keys(liveLocations));
    const now = Date.now();

    // Remove obsolete markers
    markersRef.current.forEach((marker, busId) => {
      if (!currentBusIds.has(busId)) {
        marker.setMap(null);
        markersRef.current.delete(busId);
      }
    });

    // Add or update markers
    Object.entries(liveLocations).forEach(([busId, loc]) => {
      if (typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') {
        return;
      }

      const isStale = loc.timestamp ? now - loc.timestamp > GPS_STALE_THRESHOLD_MS : false;
      const busInfo = busMap.get(busId);
      const busNumber = busInfo?.busNumber || busId;
      const position = { lat: loc.latitude, lng: loc.longitude };
      const iconUrl = isStale ? amberPinSvg : bluePinSvg;

      const existingMarker = markersRef.current.get(busId);

      if (existingMarker) {
        existingMarker.setPosition(position);
        existingMarker.setIcon({
          url: iconUrl,
          scaledSize: new google.maps.Size(30, 40),
          anchor: new google.maps.Point(15, 40),
        });
        existingMarker.setTitle(`${busNumber} (${isStale ? 'Stale' : 'Live'})`);
      } else {
        const newMarker = new google.maps.Marker({
          position,
          map,
          title: `${busNumber} (${isStale ? 'Stale' : 'Live'})`,
          label: {
            text: busNumber,
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 'bold',
            className: 'google-marker-label',
          },
          icon: {
            url: iconUrl,
            scaledSize: new google.maps.Size(30, 40),
            anchor: new google.maps.Point(15, 40),
          },
        });

        markersRef.current.set(busId, newMarker);
      }
    });
  }, [map, liveLocations, busMap]);

  // 5. Draw Route Polylines from fetched routes
  useEffect(() => {
    if (!map || !window.google?.maps || routes.length === 0 || stops.length === 0) return;

    // Clear old polylines
    polylinesRef.current.forEach((pl) => pl.setMap(null));
    polylinesRef.current = [];

    // Draw route polylines
    routes.forEach((route) => {
      if (!route.stopSequence || route.stopSequence.length < 2) return;

      const sortedStops = [...route.stopSequence].sort((a, b) => a.sequence - b.sequence);
      const pathCoordinates: google.maps.LatLngLiteral[] = [];

      sortedStops.forEach((entry) => {
        const stop = stopMap.get(entry.stopId);
        if (stop && typeof stop.latitude === 'number' && typeof stop.longitude === 'number') {
          pathCoordinates.push({ lat: stop.latitude, lng: stop.longitude });
        }
      });

      if (pathCoordinates.length >= 2) {
        const polyline = new google.maps.Polyline({
          path: pathCoordinates,
          geodesic: true,
          strokeColor: route.color || '#4f46e5',
          strokeOpacity: 0.8,
          strokeWeight: 4,
          map,
        });

        polylinesRef.current.push(polyline);
      }
    });

    return () => {
      polylinesRef.current.forEach((pl) => pl.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, routes, stops, stopMap]);

  const handleRecenter = () => {
    if (map) {
      map.panTo(CAMPUS_CENTER);
      map.setZoom(14);
    }
  };

  const handlePanToBus = (loc: LiveLocation) => {
    if (map && loc.latitude && loc.longitude) {
      map.panTo({ lat: loc.latitude, lng: loc.longitude });
      map.setZoom(16);
    }
  };

  const activeLocationsList = Object.entries(liveLocations);

  return (
    <div className="relative flex flex-col h-[calc(100vh-6.5rem)] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-50 dark:bg-slate-900">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <button
          onClick={handleRecenter}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 shadow-md backdrop-blur border border-slate-200/80 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          Recenter Campus
        </button>

        {isSimulated && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/90 text-white text-xs font-semibold shadow-md backdrop-blur">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            SIMULATED TELEMETRY ACTIVE
          </div>
        )}
      </div>

      {/* Main Map View & Side Panel */}
      <div className="relative flex-1 flex flex-col lg:flex-row h-full">
        {/* Map Canvas */}
        <div className="relative flex-1 h-full">
          {mapError === 'MISSING_KEY' ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-100 dark:bg-slate-900">
              <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 mb-4">
                <Key className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Google Maps API Key Required
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mb-4 leading-relaxed">
                To view live fleet telemetry on Google Maps, set{' '}
                <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-mono text-xs">
                  VITE_GOOGLE_MAPS_API_KEY
                </code>{' '}
                in your environment variables.
              </p>
              <div className="text-xs text-slate-500 max-w-sm">
                Ensure Maps JavaScript API is enabled in your Google Cloud Console.
              </div>
            </div>
          ) : mapError ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
              <AlertTriangle className="w-8 h-8 text-rose-500 mb-2" />
              <div className="text-sm text-rose-600 font-semibold">{mapError}</div>
            </div>
          ) : !mapReady ? (
            <div className="w-full h-full flex items-center justify-center">
              <LoadingSpinner size="lg" label="Initializing GPS Fleet Map..." />
            </div>
          ) : null}

          <div ref={mapRef} className="w-full h-full" />
        </div>

        {/* Side Panel (Fixed / Responsive right side) */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-800/95 backdrop-blur flex flex-col shrink-0 z-10 max-h-72 lg:max-h-full">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Fleet ({activeLocationsList.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">RTDB Feed</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {activeLocationsList.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <BusIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  No active fleet broadcasts
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Buses broadcasting GPS coordinates will appear here in real time.
                </p>
              </div>
            ) : (
              activeLocationsList.map(([busId, loc]) => {
                const bus = busMap.get(busId);
                const busNumber = bus?.busNumber || busId;
                const now = Date.now();
                const isStale = loc.timestamp ? now - loc.timestamp > GPS_STALE_THRESHOLD_MS : false;
                const secondsAgo = loc.timestamp ? Math.floor((now - loc.timestamp) / 1000) : null;

                return (
                  <button
                    key={busId}
                    type="button"
                    onClick={() => handlePanToBus(loc)}
                    className="w-full text-left p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-850 hover:border-indigo-300 dark:hover:border-indigo-600/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                          <BusIcon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {busNumber}
                          </div>
                          {bus?.registrationNumber && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              {bus.registrationNumber}
                            </div>
                          )}
                        </div>
                      </div>

                      {isStale ? (
                        <Badge variant="warning" withDot>Stale</Badge>
                      ) : (
                        <Badge variant="success" withDot>Live</Badge>
                      )}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                      <div className="flex items-center gap-1">
                        <Navigation className="w-3 h-3 text-slate-400" />
                        <span>{loc.speed !== undefined ? `${Math.round(loc.speed)} km/h` : '0 km/h'}</span>
                      </div>
                      <div className="font-mono text-[10px]">
                        {secondsAgo !== null
                          ? secondsAgo < 60
                            ? `${secondsAgo}s ago`
                            : `${Math.floor(secondsAgo / 60)}m ago`
                          : 'Recent'}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default LiveMapPage;
