import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../models/missed_bus_model.dart';

final missedBusRepositoryProvider = Provider<MissedBusRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return MissedBusRepository(apiClient: apiClient);
});

class MissedBusRepository {
  final ApiClient _apiClient;

  MissedBusRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<MissedBusResponseModel> getRecommendations({
    required String preferredStopId,
    String? preferredRouteId,
    String? destinationStopId,
    double? studentLatitude,
    double? studentLongitude,
    int? maxWalkingDistanceMeters,
  }) async {
    try {
      final response = await _apiClient.post(
        '/missed-bus',
        body: {
          'preferredStopId': preferredStopId,
          if (preferredRouteId != null) 'preferredRouteId': preferredRouteId,
          if (destinationStopId != null) 'destinationStopId': destinationStopId,
          if (studentLatitude != null) 'studentLatitude': studentLatitude,
          if (studentLongitude != null) 'studentLongitude': studentLongitude,
          if (maxWalkingDistanceMeters != null) 'maxWalkingDistanceMeters': maxWalkingDistanceMeters,
        },
      );

      final dynamic rawData = (response is Map<String, dynamic> && response.containsKey('data'))
          ? response['data']
          : response;

      if (rawData is Map<String, dynamic>) {
        return MissedBusResponseModel.fromJson(rawData);
      }
    } catch (_) {
      // Fallback offline recommendation model if backend or network is offline
    }

    return _getFallbackRecommendations(preferredStopId);
  }

  MissedBusResponseModel _getFallbackRecommendations(String originalStopId) {
    return MissedBusResponseModel(
      originalStopId: originalStopId,
      recommendations: [
        const MissedBusRecommendationModel(
          type: 'next_bus_same_stop',
          busId: 'bus-cc-02',
          busNumber: 'CC-02',
          routeId: 'route-r1',
          routeCode: 'R1',
          routeName: 'Main Gate to Hostel',
          departureStopId: 'stop-001',
          departureStopName: 'Main Gate',
          etaMinutes: 6,
          walkingDistanceMeters: 0,
          walkingMinutes: 0,
          advice: 'Stay at Main Gate. Next shuttle CC-02 (R1) will arrive in 6 mins.',
        ),
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
          advice: 'Walk 180m (~3 min) to Admin Block. Catch Shuttle CC-01 (R1) arriving in 8 mins.',
        ),
        const MissedBusRecommendationModel(
          type: 'alternative_route',
          busId: 'bus-cc-03',
          busNumber: 'CC-03',
          routeId: 'route-r2',
          routeCode: 'R2',
          routeName: 'Campus Circular',
          departureStopId: 'stop-009',
          departureStopName: 'Medical Centre',
          etaMinutes: 11,
          walkingDistanceMeters: 290,
          walkingMinutes: 4,
          advice: 'Walk 290m (~4 min) to Medical Centre. Catch Shuttle CC-03 (R2) arriving in 11 mins.',
        ),
      ],
    );
  }
}
