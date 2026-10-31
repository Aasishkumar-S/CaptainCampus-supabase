import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/common/custom_snackbar.dart';
import '../../../buses/presentation/providers/bus_providers.dart';
import '../../../stops/data/models/stop_model.dart';

class MyStopsScreen extends ConsumerStatefulWidget {
  const MyStopsScreen({super.key});

  @override
  ConsumerState<MyStopsScreen> createState() => _MyStopsScreenState();
}

class _MyStopsScreenState extends ConsumerState<MyStopsScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final stopsAsync = ref.watch(activeStopsProvider);
    final favoriteIdsAsync = ref.watch(favoriteStopsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Campus Stops'),
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search stops by name or landmark...',
                prefixIcon: const Icon(Icons.search_rounded),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear_rounded),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        },
                      )
                    : null,
                filled: true,
                fillColor: AppColors.surfaceVariant,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide.none,
                ),
              ),
              onChanged: (val) => setState(() => _searchQuery = val.trim().toLowerCase()),
            ),
          ),

          // Stop List
          Expanded(
            child: stopsAsync.when(
              data: (stops) {
                final filtered = stops.where((s) {
                  final nameMatch = s.stopName.toLowerCase().contains(_searchQuery);
                  final landmarkMatch = s.landmark?.toLowerCase().contains(_searchQuery) ?? false;
                  return nameMatch || landmarkMatch;
                }).toList();

                if (filtered.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.search_off_rounded, size: 54, color: Colors.grey.shade400),
                          const SizedBox(height: 12),
                          const Text(
                            'No campus stops found',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Try searching for another building or landmark.',
                            style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                final favoriteIds = favoriteIdsAsync.value ?? [];

                return ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final stop = filtered[index];
                    final isFavorite = favoriteIds.contains(stop.stopId);

                    return Card(
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                        side: BorderSide(color: Colors.grey.shade200),
                      ),
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                        leading: CircleAvatar(
                          backgroundColor: AppColors.primaryContainer,
                          child: const Icon(Icons.location_on_rounded, color: AppColors.primary),
                        ),
                        title: Text(
                          stop.stopName,
                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                        ),
                        subtitle: Text(
                          stop.landmark ?? 'Campus Stop',
                          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: Icon(
                                isFavorite ? Icons.star_rounded : Icons.star_border_rounded,
                                color: isFavorite ? Colors.amber : Colors.grey,
                              ),
                              tooltip: isFavorite ? 'Unfavorite' : 'Favorite',
                              onPressed: () {
                                ref.read(favoriteStopsProvider.notifier).toggleFavorite(stop.stopId);
                                CustomSnackBar.showSuccess(
                                  context,
                                  isFavorite
                                      ? 'Removed ${stop.stopName} from favorites'
                                      : 'Added ${stop.stopName} to favorites',
                                );
                              },
                            ),
                            const Icon(Icons.chevron_right_rounded, color: Colors.grey),
                          ],
                        ),
                        onTap: () {
                          ref.read(selectedStopProvider.notifier).state = stop;
                          context.push('/stop/${stop.stopId}');
                        },
                      ),
                    );
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Failed to load campus stops: $e')),
            ),
          ),
        ],
      ),
    );
  }
}
