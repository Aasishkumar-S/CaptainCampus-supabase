import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/common/custom_snackbar.dart';
import '../../../buses/data/models/bus_model.dart';
import '../../../buses/data/models/live_location_model.dart';
import '../../../buses/presentation/providers/bus_providers.dart';
import '../../../routes/data/models/route_model.dart';
import '../../../stops/data/models/stop_model.dart';

class LiveMapScreen extends ConsumerStatefulWidget {
  const LiveMapScreen({super.key});

  @override
  ConsumerState<LiveMapScreen> createState() => _LiveMapScreenState();
}

class _LiveMapScreenState extends ConsumerState<LiveMapScreen> {
  GoogleMapController? _mapController;

  static const LatLng _campusCenter = LatLng(12.9725, 77.5965);
  static const CameraPosition _initialCameraPosition = CameraPosition(
    target: _campusCenter,
    zoom: 15.2,
  );

  bool _showPolylines = true;
  bool _isLocating = false;
  LatLng? _userLocation;

  // Custom marker icons
  BitmapDescriptor? _busActiveIcon;
  BitmapDescriptor? _busDelayedIcon;
  BitmapDescriptor? _busStaleIcon;
  BitmapDescriptor? _stopIcon;

  @override
  void initState() {
    super.initState();
    _loadCustomIcons();
  }

  Future<void> _loadCustomIcons() async {
    _busActiveIcon = BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure);
    _busDelayedIcon = BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange);
    _busStaleIcon = BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueViolet);
    _stopIcon = BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRose);
    if (mounted) setState(() {});
  }

  Future<void> _requestAndCenterUserLocation() async {
    setState(() => _isLocating = true);
    try {
      final status = await Permission.locationWhenInUse.request();
      if (!status.isGranted) {
        if (mounted) {
          CustomSnackBar.showWarning(
            context,
            'Location permission denied. Map remains in campus view.',
          );
        }
        setState(() => _isLocating = false);
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 7),
      );

      final userPos = LatLng(position.latitude, position.longitude);
      setState(() {
        _userLocation = userPos;
        _isLocating = false;
      });

      _mapController?.animateCamera(
        CameraUpdate.newCameraPosition(
          CameraPosition(target: userPos, zoom: 16.5),
        ),
      );
    } catch (e) {
      if (mounted) {
        CustomSnackBar.showError(
          context,
          'Unable to acquire current location: $e',
        );
      }
      setState(() => _isLocating = false);
    }
  }

  void _recenterCampus() {
    _mapController?.animateCamera(
      CameraUpdate.newCameraPosition(_initialCameraPosition),
    );
  }

  Set<Polyline> _buildPolylines(List<RouteModel> routes, List<StopModel> stops) {
    if (!_showPolylines) return {};

    final stopMap = {for (var s in stops) s.stopId: LatLng(s.latitude, s.longitude)};
    final polylines = <Polyline>{};

    for (final route in routes) {
      final points = <LatLng>[];
      for (final ref in route.stops) {
        final loc = stopMap[ref.stopId];
        if (loc != null) points.add(loc);
      }

      if (points.length >= 2) {
        Color polyColor;
        switch (route.routeNumber.toUpperCase()) {
          case 'R1':
            polyColor = const Color(0xFF1565C0);
            break;
          case 'R2':
            polyColor = const Color(0xFF2E7D32);
            break;
          case 'R3':
            polyColor = const Color(0xFFF57F17);
            break;
          default:
            polyColor = Colors.indigo;
        }

        polylines.add(
          Polyline(
            polylineId: PolylineId(route.routeId),
            points: points,
            color: polyColor,
            width: 4,
            patterns: [PatternItem.dash(20), PatternItem.gap(10)],
          ),
        );
      }
    }

    return polylines;
  }

  Set<Marker> _buildMarkers({
    required List<BusModel> buses,
    required Map<String, LiveLocationModel> locations,
    required List<StopModel> stops,
  }) {
    final markers = <Marker>{};

    // User Location Marker
    if (_userLocation != null) {
      markers.add(
        Marker(
          markerId: const MarkerId('user_current_location'),
          position: _userLocation!,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueCyan),
          infoWindow: const InfoWindow(title: 'You are here'),
        ),
      );
    }

    // Bus Markers
    for (final bus in buses) {
      final loc = locations[bus.busId] ?? bus.lastLocation;
      if (loc == null) continue;

      BitmapDescriptor icon = _busActiveIcon ?? BitmapDescriptor.defaultMarker;
      if (loc.isStale) {
        icon = _busStaleIcon ?? BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueViolet);
      } else if (bus.isDelayed) {
        icon = _busDelayedIcon ?? BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange);
      }

      markers.add(
        Marker(
          markerId: MarkerId('bus_${bus.busId}'),
          position: LatLng(loc.latitude, loc.longitude),
          icon: icon,
          rotation: loc.heading ?? 0.0,
          infoWindow: InfoWindow(
            title: '${bus.busNumber} (${bus.displayPlate})',
            snippet: '${bus.status.toUpperCase()} • ${loc.speed?.toStringAsFixed(0) ?? 0} km/h',
            onTap: () => _openBusModal(bus, loc),
          ),
          onTap: () {
            ref.read(selectedBusProvider.notifier).state = bus;
            _openBusModal(bus, loc);
          },
        ),
      );
    }

    // Stop Markers
    for (final stop in stops) {
      markers.add(
        Marker(
          markerId: MarkerId('stop_${stop.stopId}'),
          position: LatLng(stop.latitude, stop.longitude),
          icon: _stopIcon ?? BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRose),
          infoWindow: InfoWindow(
            title: stop.stopName,
            snippet: stop.landmark ?? 'Campus Stop',
            onTap: () => _openStopModal(stop),
          ),
          onTap: () {
            ref.read(selectedStopProvider.notifier).state = stop;
            _openStopModal(stop);
          },
        ),
      );
    }

    return markers;
  }

  void _openBusModal(BusModel bus, LiveLocationModel loc) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        final isStale = loc.isStale;
        return Padding(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.primaryContainer,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.directions_bus_rounded,
                          color: AppColors.primary,
                          size: 26,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Shuttle ${bus.busNumber}',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          Text(
                            bus.displayPlate,
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: (isStale
                              ? Colors.purple
                              : (bus.isDelayed ? AppColors.warning : AppColors.success))
                          .withOpacity(0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      isStale ? 'GPS STALE' : bus.status.toUpperCase(),
                      style: TextStyle(
                        color: isStale
                            ? Colors.purple
                            : (bus.isDelayed ? AppColors.warning : AppColors.success),
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.surfaceVariant,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _MetricItem(
                      label: 'Speed',
                      value: '${loc.speed?.toStringAsFixed(0) ?? 0} km/h',
                      icon: Icons.speed_rounded,
                    ),
                    _MetricItem(
                      label: 'Route',
                      value: bus.currentRouteId?.replaceAll('route-', '').toUpperCase() ?? 'Active',
                      icon: Icons.alt_route_rounded,
                    ),
                    _MetricItem(
                      label: 'Capacity',
                      value: '${bus.capacity} seats',
                      icon: Icons.people_outline_rounded,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(ctx);
                    context.push('/bus/${bus.busId}');
                  },
                  icon: const Icon(Icons.info_outline_rounded),
                  label: const Text('View Shuttle Details & Manifest'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _openStopModal(StopModel stop) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Consumer(
          builder: (context, ref, child) {
            final routeId = stop.routeIds.isNotEmpty ? stop.routeIds.first : 'route-r1';
            final etaAsync = ref.watch(
              etaProvider(EtaQueryParams(stopId: stop.stopId, routeId: routeId)),
            );

            return Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 28),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 44,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.pink.shade50,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.location_on_rounded,
                          color: Colors.pinkAccent,
                          size: 26,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              stop.stopName,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            if (stop.landmark != null)
                              Text(
                                stop.landmark!,
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Real-Time Arrival Estimates',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 10),
                  etaAsync.when(
                    data: (etas) {
                      if (etas.isEmpty) {
                        return Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceVariant,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.access_time_rounded, color: Colors.grey, size: 20),
                              SizedBox(width: 10),
                              Text('No approaching shuttles on this route right now.'),
                            ],
                          ),
                        );
                      }
                      return Column(
                        children: etas.map((eta) {
                          return ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: CircleAvatar(
                              backgroundColor: AppColors.primaryContainer,
                              child: const Icon(Icons.directions_bus, color: AppColors.primary),
                            ),
                            title: Text(
                              'Shuttle ${eta.busNumber} (${eta.routeCode})',
                              style: const TextStyle(fontWeight: FontWeight.w600),
                            ),
                            subtitle: Text('Confidence: ${eta.confidence.toUpperCase()}'),
                            trailing: Text(
                              eta.displayEta,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary,
                              ),
                            ),
                          );
                        }).toList(),
                      );
                    },
                    loading: () => const Padding(
                      padding: EdgeInsets.symmetric(vertical: 20),
                      child: Center(child: CircularProgressIndicator()),
                    ),
                    error: (_, __) => Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.amber.shade50,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.schedule, color: Colors.amber, size: 20),
                          SizedBox(width: 10),
                          Text('Timetable estimate: approx. 6-8 mins'),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            ref.read(favoriteStopsProvider.notifier).toggleFavorite(stop.stopId);
                            Navigator.pop(ctx);
                            CustomSnackBar.showSuccess(
                              context,
                              'Favorite preference updated for ${stop.stopName}',
                            );
                          },
                          icon: const Icon(Icons.star_border_rounded),
                          label: const Text('Save Stop'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {
                            Navigator.pop(ctx);
                            context.push('/stop/${stop.stopId}');
                          },
                          icon: const Icon(Icons.arrow_forward_rounded),
                          label: const Text('Full Timetable'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final busesAsync = ref.watch(busesListProvider);
    final locationsAsync = ref.watch(liveLocationsStreamProvider);
    final routesAsync = ref.watch(activeRoutesProvider);
    final stopsAsync = ref.watch(activeStopsProvider);

    final buses = busesAsync.value ?? [];
    final locations = locationsAsync.value ?? {};
    final routes = routesAsync.value ?? [];
    final stops = stopsAsync.value ?? [];

    final markers = _buildMarkers(buses: buses, locations: locations, stops: stops);
    final polylines = _buildPolylines(routes, stops);

    return Scaffold(
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: _initialCameraPosition,
            onMapCreated: (ctrl) => _mapController = ctrl,
            markers: markers,
            polylines: polylines,
            zoomControlsEnabled: false,
            compassEnabled: true,
            myLocationEnabled: _userLocation != null,
            myLocationButtonEnabled: false,
          ),

          // Simulation Watermark Banner
          SafeArea(
            child: Align(
              alignment: Alignment.topCenter,
              child: Container(
                margin: const EdgeInsets.only(top: 10),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.75),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: const [
                    BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2)),
                  ],
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.sensors_rounded, color: Colors.greenAccent, size: 16),
                    SizedBox(width: 8),
                    Text(
                      'LIVE TELEMETRY ACTIVE (SIMULATED)',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Floating Action Controls
          Positioned(
            right: 16,
            bottom: 24,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                FloatingActionButton.small(
                  heroTag: 'toggle_polylines',
                  backgroundColor: Colors.white,
                  foregroundColor: _showPolylines ? AppColors.primary : Colors.grey,
                  onPressed: () => setState(() => _showPolylines = !_showPolylines),
                  tooltip: 'Toggle Route Lines',
                  child: const Icon(Icons.alt_route_rounded),
                ),
                const SizedBox(height: 10),
                FloatingActionButton.small(
                  heroTag: 'recenter_campus',
                  backgroundColor: Colors.white,
                  foregroundColor: AppColors.primary,
                  onPressed: _recenterCampus,
                  tooltip: 'Recenter Campus',
                  child: const Icon(Icons.center_focus_strong_rounded),
                ),
                const SizedBox(height: 10),
                FloatingActionButton(
                  heroTag: 'user_location',
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  onPressed: _isLocating ? null : _requestAndCenterUserLocation,
                  tooltip: 'My Location',
                  child: _isLocating
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                        )
                      : const Icon(Icons.my_location_rounded),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricItem extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _MetricItem({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: AppColors.primary, size: 20),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        ),
        Text(
          label,
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
        ),
      ],
    );
  }
}
