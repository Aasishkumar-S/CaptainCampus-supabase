import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/common/custom_snackbar.dart';
import '../../../buses/presentation/providers/bus_providers.dart';
import '../../data/models/missed_bus_model.dart';
import '../providers/missed_bus_providers.dart';

class MissedBusScreen extends ConsumerStatefulWidget {
  const MissedBusScreen({super.key});

  @override
  ConsumerState<MissedBusScreen> createState() => _MissedBusScreenState();
}

class _MissedBusScreenState extends ConsumerState<MissedBusScreen> {
  String _selectedStopId = 'stop-001';
  String? _selectedRouteId;
  String? _destinationStopId;
  Position? _studentPosition;
  bool _isAcquiringLocation = false;

  @override
  void initState() {
    super.initState();
    _checkLocation();
  }

  Future<void> _checkLocation() async {
    final status = await Permission.locationWhenInUse.status;
    if (status.isGranted) {
      try {
        final pos = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.medium,
          timeLimit: const Duration(seconds: 4),
        );
        if (mounted) setState(() => _studentPosition = pos);
      } catch (_) {}
    }
  }

  Future<void> _acquireLocation() async {
    setState(() => _isAcquiringLocation = true);
    try {
      final status = await Permission.locationWhenInUse.request();
      if (status.isGranted) {
        final pos = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
          timeLimit: const Duration(seconds: 6),
        );
        setState(() {
          _studentPosition = pos;
          _isAcquiringLocation = false;
        });
        if (mounted) {
          CustomSnackBar.showSuccess(context, 'Current GPS position linked for accurate walking radius.');
        }
      } else {
        setState(() => _isAcquiringLocation = false);
        if (mounted) {
          CustomSnackBar.showWarning(context, 'Location permission denied. Using selected stop as reference point.');
        }
      }
    } catch (e) {
      setState(() => _isAcquiringLocation = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final stopsAsync = ref.watch(activeStopsProvider);
    final routesAsync = ref.watch(activeRoutesProvider);

    final stops = stopsAsync.value ?? [];
    final routes = routesAsync.value ?? [];

    final queryArgs = MissedBusQueryArgs(
      preferredStopId: _selectedStopId,
      preferredRouteId: _selectedRouteId,
      destinationStopId: _destinationStopId,
      studentLatitude: _studentPosition?.latitude,
      studentLongitude: _studentPosition?.longitude,
    );

    final recsAsync = ref.watch(missedBusRecommendationsProvider(queryArgs));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Missed Bus Assistant'),
      ),
      body: CustomScrollView(
        slivers: [
          // Banner explanation
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF3E0),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFFFB74D)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.directions_run_rounded, color: Color(0xFFE65100), size: 36),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Missed your regular shuttle?',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              color: Color(0xFFE65100),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _studentPosition != null
                                ? 'Analyzing reachable stops within 800m of your exact position.'
                                : 'Select your boarding stop below. Connect GPS for live walking distance.',
                            style: const TextStyle(fontSize: 12, color: Color(0xFFB26A00)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Filters and selectors
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: Colors.grey.shade200),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Trip Parameters',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                      const SizedBox(height: 12),

                      // Stop dropdown
                      DropdownButtonFormField<String>(
                        value: stops.any((s) => s.stopId == _selectedStopId) ? _selectedStopId : null,
                        decoration: const InputDecoration(
                          labelText: 'Original Boarding Stop',
                          prefixIcon: Icon(Icons.pin_drop_rounded, color: AppColors.primary),
                          border: OutlineInputBorder(),
                        ),
                        items: stops.map((s) {
                          return DropdownMenuItem(
                            value: s.stopId,
                            child: Text(s.stopName, overflow: TextOverflow.ellipsis),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedStopId = val);
                        },
                      ),
                      const SizedBox(height: 12),

                      // Optional Route filter
                      DropdownButtonFormField<String?>(
                        value: _selectedRouteId,
                        decoration: const InputDecoration(
                          labelText: 'Intended Line (Optional)',
                          prefixIcon: Icon(Icons.alt_route_rounded, color: AppColors.primary),
                          border: OutlineInputBorder(),
                        ),
                        items: [
                          const DropdownMenuItem<String?>(
                            value: null,
                            child: Text('Any Feasible Campus Route'),
                          ),
                          ...routes.map((r) {
                            return DropdownMenuItem<String?>(
                              value: r.routeId,
                              child: Text('${r.routeNumber} - ${r.routeName}', overflow: TextOverflow.ellipsis),
                            );
                          }),
                        ],
                        onChanged: (val) => setState(() => _selectedRouteId = val),
                      ),
                      const SizedBox(height: 12),

                      // GPS Location button
                      OutlinedButton.icon(
                        onPressed: _isAcquiringLocation ? null : _acquireLocation,
                        icon: _isAcquiringLocation
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : Icon(
                                _studentPosition != null ? Icons.my_location_rounded : Icons.location_searching_rounded,
                                color: _studentPosition != null ? AppColors.success : AppColors.primary,
                              ),
                        label: Text(
                          _studentPosition != null
                              ? 'GPS Synced (${_studentPosition!.latitude.toStringAsFixed(4)}, ${_studentPosition!.longitude.toStringAsFixed(4)})'
                              : 'Use Current GPS Position for Walking ETA',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Header
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Ranked Alternatives',
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    icon: const Icon(Icons.refresh_rounded),
                    tooltip: 'Recalculate Alternatives',
                    onPressed: () => ref.invalidate(missedBusRecommendationsProvider(queryArgs)),
                  ),
                ],
              ),
            ),
          ),

          // Recommendations List
          recsAsync.when(
            data: (response) {
              final recs = response.recommendations;
              if (recs.isEmpty) {
                return SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(32.0),
                    child: Center(
                      child: Column(
                        children: [
                          Icon(Icons.search_off_rounded, size: 54, color: Colors.grey.shade400),
                          const SizedBox(height: 12),
                          const Text(
                            'No Suitable Shuttles Available Right Now',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'All candidate buses are currently outside the 15-minute reachable window. Check back shortly as shuttles complete their loops.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }

              return SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final rec = recs[index];
                      return _RecommendationCard(
                        rec: rec,
                        isTopRecommendation: index == 0,
                      );
                    },
                    childCount: recs.length,
                  ),
                ),
              );
            },
            loading: () => const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (err, _) => SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Center(child: Text('Failed to compute alternatives: $err')),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _RecommendationCard extends ConsumerWidget {
  final MissedBusRecommendationModel rec;
  final bool isTopRecommendation;

  const _RecommendationCard({
    required this.rec,
    required this.isTopRecommendation,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Color badgeColor;
    String badgeLabel;

    switch (rec.type) {
      case 'next_bus_same_stop':
        badgeColor = AppColors.success;
        badgeLabel = 'STAY AT STOP';
        break;
      case 'alternative_stop_same_route':
        badgeColor = const Color(0xFF1565C0);
        badgeLabel = 'WALK TO NEXT STOP';
        break;
      default:
        badgeColor = const Color(0xFFF57F17);
        badgeLabel = 'ALT ROUTE';
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: isTopRecommendation ? 2 : 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: isTopRecommendation ? AppColors.primary.withOpacity(0.5) : Colors.grey.shade200,
          width: isTopRecommendation ? 1.5 : 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    if (isTopRecommendation)
                      Container(
                        margin: const EdgeInsets.only(right: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.amber.shade100,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'BEST OPTION',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: Colors.brown,
                          ),
                        ),
                      ),
                    Text(
                      'Shuttle ${rec.busNumber} (${rec.routeCode})',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: badgeColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    badgeLabel,
                    style: TextStyle(
                      color: badgeColor,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              rec.routeName,
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 12),

            // Advice container
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    rec.isSameStop ? Icons.pan_tool_rounded : Icons.directions_walk_rounded,
                    color: AppColors.primary,
                    size: 20,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      rec.advice,
                      style: const TextStyle(fontSize: 13, height: 1.3),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Metrics row
            Row(
              children: [
                if (rec.isWalkRequired) ...[
                  const Icon(Icons.directions_walk, size: 16, color: AppColors.textSecondary),
                  const SizedBox(width: 4),
                  Text(
                    '${rec.walkingDistanceMeters}m (~${rec.walkingMinutes} min)',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                  ),
                  const Spacer(),
                ],
                const Icon(Icons.access_time_filled, size: 16, color: AppColors.primary),
                const SizedBox(width: 4),
                Text(
                  'Arrives in ${rec.etaMinutes} min',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Navigation Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  ref.read(selectedRecommendationProvider.notifier).state = rec;
                  context.push('/walking-directions');
                },
                icon: Icon(
                  rec.isSameStop ? Icons.map_rounded : Icons.navigation_rounded,
                  size: 18,
                ),
                label: Text(
                  rec.isSameStop ? 'View Shuttle on Live Map' : 'Start Walking Directions',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
