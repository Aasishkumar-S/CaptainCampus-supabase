import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/bus_model.dart';
import '../../data/models/live_location_model.dart';
import '../../data/repositories/bus_repository.dart';
import '../../../routes/data/models/route_model.dart';
import '../../../routes/data/repositories/route_repository.dart';
import '../../../stops/data/models/stop_model.dart';
import '../../../stops/data/models/eta_model.dart';
import '../../../stops/data/repositories/stop_repository.dart';

/// Active buses list fetched from backend API or offline mock
final busesListProvider = FutureProvider<List<BusModel>>((ref) async {
  final busRepo = ref.watch(busRepositoryProvider);
  return await busRepo.getBuses();
});

/// Real-time stream of bus GPS positions from RTDB or animated simulator
final liveLocationsStreamProvider =
    StreamProvider<Map<String, LiveLocationModel>>((ref) {
  final busRepo = ref.watch(busRepositoryProvider);
  return busRepo.getLiveLocationsStream();
});

/// Currently selected bus on map or details sheet
final selectedBusProvider = StateProvider<BusModel?>((ref) => null);

/// Currently selected campus stop on map or details sheet
final selectedStopProvider = StateProvider<StopModel?>((ref) => null);

/// Active routes list
final activeRoutesProvider = FutureProvider<List<RouteModel>>((ref) async {
  final routeRepo = ref.watch(routeRepositoryProvider);
  return await routeRepo.getRoutes();
});

/// Active stops list
final activeStopsProvider = FutureProvider<List<StopModel>>((ref) async {
  final stopRepo = ref.watch(stopRepositoryProvider);
  return await stopRepo.getStops();
});

/// Parameters for ETA family query
class EtaQueryParams extends Equatable {
  final String stopId;
  final String routeId;

  const EtaQueryParams({required this.stopId, required this.routeId});

  @override
  List<Object?> get props => [stopId, routeId];
}

/// Real-time arrival estimates (ETA) for a given stop & route
final etaProvider = FutureProvider.family<List<EtaModel>, EtaQueryParams>(
  (ref, params) async {
    final stopRepo = ref.watch(stopRepositoryProvider);
    return await stopRepo.getEtasForStop(
      stopId: params.stopId,
      routeId: params.routeId,
    );
  },
);

/// Favorite stop IDs list
class FavoriteStopsNotifier extends StateNotifier<AsyncValue<List<String>>> {
  final StopRepository _stopRepo;

  FavoriteStopsNotifier(this._stopRepo) : super(const AsyncValue.loading()) {
    _loadFavorites();
  }

  Future<void> _loadFavorites() async {
    try {
      final list = await _stopRepo.getFavoriteStopIds();
      state = AsyncValue.data(list);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> toggleFavorite(String stopId) async {
    final current = state.value ?? [];
    final isFav = current.contains(stopId);
    final updated = List<String>.from(current);

    if (isFav) {
      updated.remove(stopId);
    } else {
      updated.add(stopId);
    }
    state = AsyncValue.data(updated);

    await _stopRepo.toggleFavoriteStop(stopId);
  }
}

final favoriteStopsProvider =
    StateNotifierProvider<FavoriteStopsNotifier, AsyncValue<List<String>>>((ref) {
  final stopRepo = ref.watch(stopRepositoryProvider);
  return FavoriteStopsNotifier(stopRepo);
});
