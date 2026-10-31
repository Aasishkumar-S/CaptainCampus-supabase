import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../models/route_model.dart';

final routeRepositoryProvider = Provider<RouteRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return RouteRepository(apiClient: apiClient);
});

class RouteRepository {
  final ApiClient _apiClient;

  RouteRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  static const List<RouteModel> mockRoutes = [
    RouteModel(
      routeId: 'route-r1',
      routeNumber: 'R1',
      routeName: 'Main Gate to Hostel',
      direction: 'inbound',
      startPoint: 'Main Gate',
      endPoint: 'Boys Hostel B',
      color: '#1565C0',
      estimatedDuration: 20,
      stops: [
        RouteStopReference(stopId: 'stop-001', sequence: 1, scheduledTime: '08:00', scheduledOffset: 0),
        RouteStopReference(stopId: 'stop-002', sequence: 2, scheduledTime: '08:03', scheduledOffset: 3),
        RouteStopReference(stopId: 'stop-003', sequence: 3, scheduledTime: '08:06', scheduledOffset: 6),
        RouteStopReference(stopId: 'stop-004', sequence: 4, scheduledTime: '08:09', scheduledOffset: 9),
        RouteStopReference(stopId: 'stop-005', sequence: 5, scheduledTime: '08:12', scheduledOffset: 12),
        RouteStopReference(stopId: 'stop-006', sequence: 6, scheduledTime: '08:15', scheduledOffset: 15),
        RouteStopReference(stopId: 'stop-007', sequence: 7, scheduledTime: '08:18', scheduledOffset: 18),
        RouteStopReference(stopId: 'stop-008', sequence: 8, scheduledTime: '08:20', scheduledOffset: 20),
      ],
      isActive: true,
    ),
    RouteModel(
      routeId: 'route-r2',
      routeNumber: 'R2',
      routeName: 'Campus Circular',
      direction: 'circular',
      startPoint: 'Main Gate',
      endPoint: 'Main Gate',
      color: '#2E7D32',
      estimatedDuration: 25,
      stops: [
        RouteStopReference(stopId: 'stop-001', sequence: 1, scheduledTime: '08:10', scheduledOffset: 0),
        RouteStopReference(stopId: 'stop-009', sequence: 2, scheduledTime: '08:13', scheduledOffset: 3),
        RouteStopReference(stopId: 'stop-010', sequence: 3, scheduledTime: '08:16', scheduledOffset: 6),
        RouteStopReference(stopId: 'stop-011', sequence: 4, scheduledTime: '08:19', scheduledOffset: 9),
        RouteStopReference(stopId: 'stop-012', sequence: 5, scheduledTime: '08:22', scheduledOffset: 12),
        RouteStopReference(stopId: 'stop-013', sequence: 6, scheduledTime: '08:25', scheduledOffset: 15),
        RouteStopReference(stopId: 'stop-014', sequence: 7, scheduledTime: '08:28', scheduledOffset: 18),
        RouteStopReference(stopId: 'stop-015', sequence: 8, scheduledTime: '08:31', scheduledOffset: 21),
        RouteStopReference(stopId: 'stop-016', sequence: 9, scheduledTime: '08:33', scheduledOffset: 23),
        RouteStopReference(stopId: 'stop-001', sequence: 10, scheduledTime: '08:35', scheduledOffset: 25),
      ],
      isActive: true,
    ),
    RouteModel(
      routeId: 'route-r3',
      routeNumber: 'R3',
      routeName: 'Express: Gate to Academic Block',
      direction: 'outbound',
      startPoint: 'Main Gate',
      endPoint: 'Academic Block B',
      color: '#F57F17',
      estimatedDuration: 12,
      stops: [
        RouteStopReference(stopId: 'stop-001', sequence: 1, scheduledTime: '08:20', scheduledOffset: 0),
        RouteStopReference(stopId: 'stop-017', sequence: 2, scheduledTime: '08:22', scheduledOffset: 2),
        RouteStopReference(stopId: 'stop-018', sequence: 3, scheduledTime: '08:24', scheduledOffset: 4),
        RouteStopReference(stopId: 'stop-002', sequence: 4, scheduledTime: '08:27', scheduledOffset: 7),
        RouteStopReference(stopId: 'stop-019', sequence: 5, scheduledTime: '08:30', scheduledOffset: 10),
        RouteStopReference(stopId: 'stop-020', sequence: 6, scheduledTime: '08:32', scheduledOffset: 12),
      ],
      isActive: true,
    ),
  ];

  Future<List<RouteModel>> getRoutes() async {
    try {
      final response = await _apiClient.get('/routes');
      final dynamic rawData = (response is Map<String, dynamic> && response.containsKey('data'))
          ? response['data']
          : response;

      if (rawData is List) {
        final list = rawData
            .map((item) => RouteModel.fromJson(item as Map<String, dynamic>))
            .toList();
        if (list.isNotEmpty) {
          // If the summary items don't have full stopSequence, enrich from mock data
          return list.map((route) {
            if (route.stops.isEmpty) {
              final mock = mockRoutes.firstWhere(
                (m) => m.routeId == route.routeId || m.routeNumber == route.routeNumber,
                orElse: () => route,
              );
              return route.copyWith(stops: mock.stops, color: mock.color);
            }
            return route;
          }).toList();
        }
      }
    } catch (_) {
      // Fallback to offline mock routes
    }
    return mockRoutes;
  }

  Future<RouteModel?> getRouteById(String routeId) async {
    try {
      final response = await _apiClient.get('/routes/$routeId');
      final dynamic rawData = (response is Map<String, dynamic> && response.containsKey('data'))
          ? response['data']
          : response;

      if (rawData is Map<String, dynamic>) {
        return RouteModel.fromJson(rawData);
      }
    } catch (_) {
      // Fallback
    }

    try {
      return mockRoutes.firstWhere((r) => r.routeId == routeId || r.routeNumber.toLowerCase() == routeId.toLowerCase());
    } catch (_) {
      return null;
    }
  }
}
