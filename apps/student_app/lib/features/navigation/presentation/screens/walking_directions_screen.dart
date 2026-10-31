import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../buses/presentation/providers/bus_providers.dart';
import '../../data/models/missed_bus_model.dart';
import '../providers/missed_bus_providers.dart';

class WalkingDirectionsScreen extends ConsumerStatefulWidget {
  const WalkingDirectionsScreen({super.key});

  @override
  ConsumerState<WalkingDirectionsScreen> createState() => _WalkingDirectionsScreenState();
}

class _WalkingDirectionsScreenState extends ConsumerState<WalkingDirectionsScreen> {
  GoogleMapController? _mapController;

  static const LatLng _defaultOrigin = LatLng(12.9716, 77.5946); // Main Gate
  static const LatLng _defaultTarget = LatLng(12.9722, 77.5952); // Admin Block

  @override
  Widget build(BuildContext context) {
    final rec = ref.watch(selectedRecommendationProvider) ??
        const MissedBusRecommendationModel(
          type: 'alternative_stop_same_route',
          busId: 'bus-cc-01',
          busNumber: 'CC-01',
          routeId: 'route-r1',
          routeCode: 'R1',
          routeName: 'Main Gate to Hostel',
          departureStopId: 'stop-002',
          departureStopName: 'Admin Block',
          etaMinutes: 8,
          walkingDistanceMeters: 180,
          walkingMinutes: 3,
          advice: 'Walk 180m (~3 min) to Admin Block. Catch Shuttle CC-01 (R1).',
        );

    final stops = ref.watch(activeStopsProvider).value ?? [];
    final targetStop = stops.where((s) => s.stopId == rec.departureStopId).isNotEmpty
        ? stops.firstWhere((s) => s.stopId == rec.departureStopId)
        : null;

    final targetLatLng = targetStop != null
        ? LatLng(targetStop.latitude, targetStop.longitude)
        : _defaultTarget;

    final markers = <Marker>{
      Marker(
        markerId: const MarkerId('start_location'),
        position: _defaultOrigin,
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueCyan),
        infoWindow: const InfoWindow(title: 'Start Location'),
      ),
      Marker(
        markerId: const MarkerId('target_stop'),
        position: targetLatLng,
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRose),
        infoWindow: InfoWindow(
          title: rec.departureStopName,
          snippet: 'Board Shuttle ${rec.busNumber} here',
        ),
      ),
    };

    final walkingPolyline = Polyline(
      polylineId: const PolylineId('walking_route'),
      points: [_defaultOrigin, targetLatLng],
      color: Colors.blueAccent,
      width: 5,
      patterns: [PatternItem.dot, PatternItem.gap(10)],
    );

    return Scaffold(
      appBar: AppBar(
        title: Text(rec.isSameStop ? 'Boarding Guidance' : 'Walking Navigation'),
      ),
      body: Column(
        children: [
          // Embedded Interactive Map
          Expanded(
            flex: 5,
            child: Stack(
              children: [
                GoogleMap(
                  initialCameraPosition: CameraPosition(
                    target: LatLng(
                      (_defaultOrigin.latitude + targetLatLng.latitude) / 2,
                      (_defaultOrigin.longitude + targetLatLng.longitude) / 2,
                    ),
                    zoom: 17.0,
                  ),
                  onMapCreated: (ctrl) => _mapController = ctrl,
                  markers: markers,
                  polylines: {walkingPolyline},
                  zoomControlsEnabled: false,
                  myLocationButtonEnabled: false,
                ),
                Positioned(
                  top: 12,
                  left: 16,
                  right: 16,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: const [
                        BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 2)),
                      ],
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.directions_walk_rounded, color: AppColors.primary),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            rec.isSameStop
                                ? 'Wait at ${rec.departureStopName}'
                                : 'Walk ${rec.walkingDistanceMeters}m to ${rec.departureStopName}',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ),
                        Text(
                          '~${rec.walkingMinutes} min',
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Steps list & summary
          Expanded(
            flex: 6,
            child: Container(
              color: Colors.white,
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  // Next shuttle alert
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.primaryContainer.withOpacity(0.4),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.primaryContainer),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.directions_bus_rounded, color: AppColors.primary, size: 28),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Shuttle ${rec.busNumber} (${rec.routeCode})',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                              ),
                              Text(
                                'Predicted departure in ${rec.etaMinutes} mins',
                                style: const TextStyle(color: AppColors.primary, fontSize: 13),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.successLight.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'CATCHABLE',
                            style: TextStyle(
                              color: AppColors.success,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  const Text(
                    'Step-by-Step Walking Route',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 12),

                  _DirectionStepTile(
                    stepNumber: 1,
                    instruction: 'Exit current hub area toward North Campus walkway.',
                    distance: '50m',
                    icon: Icons.straight_rounded,
                  ),
                  _DirectionStepTile(
                    stepNumber: 2,
                    instruction: 'Turn right at the academic pathway near the courtyard garden.',
                    distance: '80m',
                    icon: Icons.turn_right_rounded,
                  ),
                  _DirectionStepTile(
                    stepNumber: 3,
                    instruction: 'Continue straight to ${rec.departureStopName} shelter.',
                    distance: '${rec.walkingDistanceMeters > 130 ? rec.walkingDistanceMeters - 130 : 50}m',
                    icon: Icons.pin_drop_rounded,
                    isLast: true,
                  ),

                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => context.go('/home/live-map'),
                      icon: const Icon(Icons.map_rounded),
                      label: const Text('Track Full Route on Live Map'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DirectionStepTile extends StatelessWidget {
  final int stepNumber;
  final String instruction;
  final String distance;
  final IconData icon;
  final bool isLast;

  const _DirectionStepTile({
    required this.stepNumber,
    required this.instruction,
    required this.distance,
    required this.icon,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            CircleAvatar(
              radius: 14,
              backgroundColor: isLast ? AppColors.success : AppColors.primaryContainer,
              child: Icon(icon, size: 16, color: isLast ? Colors.white : AppColors.primary),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 38,
                color: Colors.grey.shade300,
                margin: const EdgeInsets.symmetric(vertical: 4),
              ),
          ],
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  instruction,
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                ),
                const SizedBox(height: 2),
                Text(
                  distance,
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
