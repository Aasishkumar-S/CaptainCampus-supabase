import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/common/custom_snackbar.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../buses/presentation/providers/bus_providers.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userProfileAsync = ref.watch(userProfileProvider);
    final user = ref.watch(authStateProvider).value;
    final studentName = userProfileAsync.value?.name ??
        (user?.userMetadata?['display_name'] as String?) ??
        (user?.userMetadata?['name'] as String?) ??
        'Student';

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // Top Greeting Header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Good morning, $studentName!',
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                              letterSpacing: -0.4,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'North Campus Shuttle Network',
                            style: TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    GestureDetector(
                      onTap: () => context.go('/home/profile'),
                      child: CircleAvatar(
                        radius: 22,
                        backgroundColor: AppColors.primaryContainer,
                        child: const Icon(
                          Icons.person_rounded,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Service Status Banner
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.successLight.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppColors.successLight.withOpacity(0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: AppColors.success,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Text(
                          'All campus shuttle lines operating normally',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.success,
                          ),
                        ),
                      ),
                      if (AppConstants.demoModeAvailable)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.warningLight.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'DEMO',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: AppColors.warning,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),

            // Hero Card: Next Bus
            SliverToBoxAdapter(
              child: Consumer(
                builder: (context, ref, _) {
                  final buses = ref.watch(busesListProvider).value ?? [];
                  final locations = ref.watch(liveLocationsStreamProvider).value ?? {};
                  final activeBus = buses.isNotEmpty ? buses.first : null;
                  final busLoc = activeBus != null ? locations[activeBus.busId] : null;

                  return Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppColors.primary, AppColors.primaryDark],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withOpacity(0.3),
                            blurRadius: 16,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(20.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.directions_bus,
                                          color: Colors.white, size: 16),
                                      const SizedBox(width: 6),
                                      Text(
                                        activeBus != null
                                            ? '${activeBus.busNumber} • ROUTE ${activeBus.currentRouteId?.replaceAll("route-r", "R").toUpperCase() ?? "R1"}'
                                            : 'CC-01 • ROUTE R1',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w700,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.greenAccent.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    (busLoc != null && !busLoc.isStale)
                                        ? 'LIVE EN ROUTE'
                                        : 'SCHEDULED',
                                    style: const TextStyle(
                                      color: Colors.greenAccent,
                                      fontWeight: FontWeight.w800,
                                      fontSize: 11,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 18),
                            const Text(
                              'Next Arrival at Your Preferred Stop',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 13,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.baseline,
                              textBaseline: TextBaseline.alphabetic,
                              children: [
                                Text(
                                  (busLoc != null && (busLoc.speed ?? 0) > 0)
                                      ? '4'
                                      : '5',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 44,
                                    fontWeight: FontWeight.w800,
                                    height: 1.0,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                const Text(
                                  'MIN',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 18,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Text(
                                  busLoc != null
                                      ? 'Speed: ${busLoc.speed?.toStringAsFixed(0) ?? 0} km/h'
                                      : '(Approx. 8:15 AM)',
                                  style: const TextStyle(
                                    color: Colors.white70,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            const Row(
                              children: [
                                Icon(Icons.location_on,
                                    color: Colors.white70, size: 16),
                                SizedBox(width: 6),
                                Text(
                                  'Main Gate Campus Hub',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 18),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: () {
                                  if (activeBus != null) {
                                    ref.read(selectedBusProvider.notifier).state = activeBus;
                                  }
                                  context.go('/home/live-map');
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.white,
                                  foregroundColor: AppColors.primary,
                                  elevation: 0,
                                ),
                                child: const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.navigation_rounded, size: 18),
                                    SizedBox(width: 8),
                                    Text(
                                      'Track on Live Map',
                                      style: TextStyle(fontWeight: FontWeight.w700),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),

            // Quick Actions Header
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(20, 8, 20, 10),
                child: Text(
                  'Quick Actions',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            ),

            // Quick Actions Row
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    // I Missed My Bus (Orange/Red)
                    Expanded(
                      flex: 4,
                      child: GestureDetector(
                        onTap: () => context.push('/missed-bus'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              vertical: 14, horizontal: 12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF3E0),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFFFB74D)),
                          ),
                          child: const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Icon(Icons.warning_amber_rounded,
                                  color: Color(0xFFE65100), size: 26),
                              SizedBox(height: 8),
                              Text(
                                'Missed Bus?',
                                style: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 14,
                                  color: Color(0xFFE65100),
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Find alternate stops',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Color(0xFFB26A00),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    // My Stops
                    Expanded(
                      flex: 3,
                      child: GestureDetector(
                        onTap: () => context.go('/home/my-stops'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              vertical: 14, horizontal: 12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: AppColors.divider),
                          ),
                          child: const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Icon(Icons.pin_drop_rounded,
                                  color: AppColors.primary, size: 26),
                              SizedBox(height: 8),
                              Text(
                                'My Stops',
                                style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 14,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Saved favorites',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    // All Routes
                    Expanded(
                      flex: 3,
                      child: GestureDetector(
                        onTap: () {
                          CustomSnackBar.showInfo(
                              context, 'Opening Routes directory');
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              vertical: 14, horizontal: 12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: AppColors.divider),
                          ),
                          child: const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Icon(Icons.alt_route_rounded,
                                  color: AppColors.accent, size: 26),
                              SizedBox(height: 8),
                              Text(
                                'All Routes',
                                style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 14,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Schedule & map',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Nearby Stops Header
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(20, 24, 20, 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Nearby Stops',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      'Simulated Data',
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.textTertiary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Nearby Stops Cards
            SliverList(
              delegate: SliverChildListDelegate([
                _buildStopCard(
                  context,
                  stopName: 'Hostel Block 4 Circle',
                  distance: '150m away',
                  nextBus: 'Bus 02 • Route B',
                  eta: '6 mins',
                  onTap: () => context.push('/stop/stop_hostel_4'),
                ),
                _buildStopCard(
                  context,
                  stopName: 'Engineering Faculty Quad',
                  distance: '320m away',
                  nextBus: 'Bus 01 • Route A',
                  eta: '11 mins',
                  onTap: () => context.push('/stop/stop_eng_quad'),
                ),
                _buildStopCard(
                  context,
                  stopName: 'Central Library South Gate',
                  distance: '540m away',
                  nextBus: 'Bus 05 • Route C',
                  eta: '19 mins',
                  onTap: () => context.push('/stop/stop_library'),
                ),
                const SizedBox(height: 28),
              ]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStopCard(
    BuildContext context, {
    required String stopName,
    required String distance,
    required String nextBus,
    required String eta,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
      child: Card(
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.primaryContainer.withOpacity(0.7),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.directions_bus_rounded,
                    color: AppColors.primary,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        stopName,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        '$nextBus • $distance',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      eta,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                    ),
                    const Text(
                      'arrival',
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.textTertiary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
