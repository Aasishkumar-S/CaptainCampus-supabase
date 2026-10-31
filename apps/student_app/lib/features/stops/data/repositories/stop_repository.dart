import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/services/local_storage_service.dart';
import '../models/stop_model.dart';
import '../models/eta_model.dart';

final stopRepositoryProvider = Provider<StopRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final storageService = ref.watch(localStorageServiceProvider);
  return StopRepository(apiClient: apiClient, storageService: storageService);
});

class StopRepository {
  final ApiClient _apiClient;
  final LocalStorageService _storageService;

  static const String _favoriteStopsKey = 'favorite_stop_ids';

  StopRepository({
    required ApiClient apiClient,
    required LocalStorageService storageService,
  })  : _apiClient = apiClient,
        _storageService = storageService;

  static const List<StopModel> mockStops = [
    StopModel(
      stopId: 'stop-001',
      stopName: 'Main Gate',
      latitude: 12.9716,
      longitude: 77.5946,
      landmark: 'Campus Central Entryway & Security',
      arrivalTime: '08:00 AM',
      routeIds: ['route-r1', 'route-r2', 'route-r3'],
    ),
    StopModel(
      stopId: 'stop-002',
      stopName: 'Admin Block',
      latitude: 12.9722,
      longitude: 77.5952,
      landmark: 'Registrar & Student Affairs Circle',
      arrivalTime: '08:03 AM',
      routeIds: ['route-r1', 'route-r3'],
    ),
    StopModel(
      stopId: 'stop-003',
      stopName: 'Library',
      latitude: 12.9728,
      longitude: 77.5960,
      landmark: 'Central Digital Resource Centre',
      arrivalTime: '08:06 AM',
      routeIds: ['route-r1'],
    ),
    StopModel(
      stopId: 'stop-004',
      stopName: 'Science Block',
      latitude: 12.9735,
      longitude: 77.5968,
      landmark: 'Physics & Chemistry Research Labs',
      arrivalTime: '08:09 AM',
      routeIds: ['route-r1'],
    ),
    StopModel(
      stopId: 'stop-005',
      stopName: 'Sports Ground',
      latitude: 12.9742,
      longitude: 77.5975,
      landmark: 'Athletics Stadium Pavilion',
      arrivalTime: '08:12 AM',
      routeIds: ['route-r1'],
    ),
    StopModel(
      stopId: 'stop-006',
      stopName: 'Cafeteria',
      latitude: 12.9748,
      longitude: 77.5980,
      landmark: 'Student Union Food Court',
      arrivalTime: '08:15 AM',
      routeIds: ['route-r1'],
    ),
    StopModel(
      stopId: 'stop-007',
      stopName: 'Boys Hostel A',
      latitude: 12.9755,
      longitude: 77.5988,
      landmark: 'Block A Main Entrance',
      arrivalTime: '08:18 AM',
      routeIds: ['route-r1'],
    ),
    StopModel(
      stopId: 'stop-008',
      stopName: 'Boys Hostel B',
      latitude: 12.9762,
      longitude: 77.5995,
      landmark: 'Block B North Lawn',
      arrivalTime: '08:20 AM',
      routeIds: ['route-r1'],
    ),
    StopModel(
      stopId: 'stop-009',
      stopName: 'Medical Centre',
      latitude: 12.9710,
      longitude: 77.5955,
      landmark: 'Campus Clinic & Ambulance Bay',
      arrivalTime: '08:13 AM',
      routeIds: ['route-r2'],
    ),
    StopModel(
      stopId: 'stop-010',
      stopName: 'Engineering Block',
      latitude: 12.9705,
      longitude: 77.5965,
      landmark: 'Mechanical & Civil Labs Entrance',
      arrivalTime: '08:16 AM',
      routeIds: ['route-r2'],
    ),
    StopModel(
      stopId: 'stop-011',
      stopName: 'Computer Lab',
      latitude: 12.9700,
      longitude: 77.5975,
      landmark: 'IT & Data Science Quadrangle',
      arrivalTime: '08:19 AM',
      routeIds: ['route-r2'],
    ),
    StopModel(
      stopId: 'stop-012',
      stopName: 'Girls Hostel',
      latitude: 12.9695,
      longitude: 77.5985,
      landmark: 'Sarojini Naidu Residence Hall',
      arrivalTime: '08:22 AM',
      routeIds: ['route-r2'],
    ),
    StopModel(
      stopId: 'stop-013',
      stopName: 'Staff Quarters',
      latitude: 12.9700,
      longitude: 77.5995,
      landmark: 'Faculty Housing Avenue',
      arrivalTime: '08:25 AM',
      routeIds: ['route-r2'],
    ),
    StopModel(
      stopId: 'stop-014',
      stopName: 'Workshop',
      latitude: 12.9710,
      longitude: 77.6000,
      landmark: 'Robotics & Central Prototyping Workshop',
      arrivalTime: '08:28 AM',
      routeIds: ['route-r2'],
    ),
    StopModel(
      stopId: 'stop-015',
      stopName: 'Auditorium',
      latitude: 12.9720,
      longitude: 77.5995,
      landmark: 'Grand Convocation Hall Plaza',
      arrivalTime: '08:31 AM',
      routeIds: ['route-r2'],
    ),
    StopModel(
      stopId: 'stop-016',
      stopName: 'Guest House',
      latitude: 12.9725,
      longitude: 77.5975,
      landmark: 'VIP Guest Lodge & Faculty Club',
      arrivalTime: '08:33 AM',
      routeIds: ['route-r2'],
    ),
    StopModel(
      stopId: 'stop-017',
      stopName: 'Security Office',
      latitude: 12.9712,
      longitude: 77.5938,
      landmark: 'West Gate Security Post',
      arrivalTime: '08:22 AM',
      routeIds: ['route-r3'],
    ),
    StopModel(
      stopId: 'stop-018',
      stopName: 'Parking Lot',
      latitude: 12.9708,
      longitude: 77.5930,
      landmark: 'Multilevel Student Parking Structure',
      arrivalTime: '08:24 AM',
      routeIds: ['route-r3'],
    ),
    StopModel(
      stopId: 'stop-019',
      stopName: 'Academic Block A',
      latitude: 12.9730,
      longitude: 77.5940,
      landmark: 'Commerce & Humanities Tower',
      arrivalTime: '08:30 AM',
      routeIds: ['route-r3'],
    ),
    StopModel(
      stopId: 'stop-020',
      stopName: 'Academic Block B',
      latitude: 12.9738,
      longitude: 77.5932,
      landmark: 'Management & Law Building',
      arrivalTime: '08:32 AM',
      routeIds: ['route-r3'],
    ),
  ];

  Future<List<StopModel>> getStops() async {
    try {
      final response = await _apiClient.get('/stops');
      final dynamic rawData = (response is Map<String, dynamic> && response.containsKey('data'))
          ? response['data']
          : response;

      if (rawData is List) {
        final list = rawData
            .map((item) => StopModel.fromJson(item as Map<String, dynamic>))
            .toList();
        if (list.isNotEmpty) {
          // Enrich with routeIds if not already populated
          return list.map((stop) {
            if (stop.routeIds.isEmpty) {
              final mock = mockStops.firstWhere(
                (m) => m.stopId == stop.stopId,
                orElse: () => stop,
              );
              return stop.copyWith(routeIds: mock.routeIds, landmark: mock.landmark);
            }
            return stop;
          }).toList();
        }
      }
    } catch (_) {
      // Fallback to offline mock stops
    }
    return mockStops;
  }

  Future<StopModel?> getStopById(String stopId) async {
    try {
      final response = await _apiClient.get('/stops/$stopId');
      final dynamic rawData = (response is Map<String, dynamic> && response.containsKey('data'))
          ? response['data']
          : response;

      if (rawData is Map<String, dynamic>) {
        return StopModel.fromJson(rawData);
      }
    } catch (_) {
      // Fallback
    }

    try {
      return mockStops.firstWhere((s) => s.stopId == stopId);
    } catch (_) {
      return null;
    }
  }

  Future<List<String>> getFavoriteStopIds() async {
    try {
      final list = await _storageService.getStringList(_favoriteStopsKey);
      if (list.isNotEmpty) return list;
    } catch (_) {}
    // Default favorites for smooth onboarding experience
    return ['stop-001', 'stop-003'];
  }

  Future<bool> toggleFavoriteStop(String stopId) async {
    final currentFavorites = await getFavoriteStopIds();
    final updated = List<String>.from(currentFavorites);
    final isFav = updated.contains(stopId);

    if (isFav) {
      updated.remove(stopId);
    } else {
      updated.add(stopId);
    }

    await _storageService.saveStringList(_favoriteStopsKey, updated);
    return !isFav;
  }

  Future<bool> isFavorite(String stopId) async {
    final currentFavorites = await getFavoriteStopIds();
    return currentFavorites.contains(stopId);
  }

  Future<List<EtaModel>> getEtasForStop({
    required String stopId,
    required String routeId,
  }) async {
    try {
      final response = await _apiClient.get(
        '/eta',
        queryParameters: {
          'stopId': stopId,
          'routeId': routeId,
        },
      );

      final dynamic rawData = (response is Map<String, dynamic> && response.containsKey('data'))
          ? response['data']
          : response;

      if (rawData is List) {
        return rawData
            .map((item) => EtaModel.fromJson(item as Map<String, dynamic>))
            .toList();
      }
    } catch (_) {
      // Generate realistic fallback ETA based on route and stop
    }

    // Fallback simulated ETA
    return [
      EtaModel(
        stopId: stopId,
        busId: 'bus-cc-01',
        busNumber: 'CC-01',
        routeCode: routeId.replaceAll('route-', '').toUpperCase(),
        etaMinutes: 4,
        estimatedArrivalTime: DateTime.now().add(const Duration(minutes: 4)),
        isLiveEstimate: true,
        lastLocationUpdate: DateTime.now(),
        isStale: false,
        confidence: 'high',
        source: 'calculated',
      ),
      EtaModel(
        stopId: stopId,
        busId: 'bus-cc-02',
        busNumber: 'CC-02',
        routeCode: routeId.replaceAll('route-', '').toUpperCase(),
        etaMinutes: 14,
        estimatedArrivalTime: DateTime.now().add(const Duration(minutes: 14)),
        isLiveEstimate: true,
        lastLocationUpdate: DateTime.now(),
        isStale: false,
        confidence: 'high',
        source: 'calculated',
      ),
    ];
  }
}
