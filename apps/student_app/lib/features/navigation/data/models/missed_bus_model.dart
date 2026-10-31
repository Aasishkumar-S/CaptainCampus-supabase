import 'package:equatable/equatable.dart';

class MissedBusRecommendationModel extends Equatable {
  final String type; // 'next_bus_same_stop' | 'alternative_stop_same_route' | 'alternative_route'
  final String busId;
  final String busNumber;
  final String routeId;
  final String routeCode;
  final String routeName;
  final String departureStopId;
  final String departureStopName;
  final int etaMinutes;
  final DateTime? estimatedDepartureTime;
  final int walkingDistanceMeters;
  final int walkingMinutes;
  final String advice;

  const MissedBusRecommendationModel({
    required this.type,
    required this.busId,
    required this.busNumber,
    required this.routeId,
    required this.routeCode,
    required this.routeName,
    required this.departureStopId,
    required this.departureStopName,
    required this.etaMinutes,
    this.estimatedDepartureTime,
    this.walkingDistanceMeters = 0,
    this.walkingMinutes = 0,
    required this.advice,
  });

  bool get isSameStop => type == 'next_bus_same_stop';
  bool get isWalkRequired => walkingDistanceMeters > 0;

  factory MissedBusRecommendationModel.fromJson(Map<String, dynamic> json) {
    DateTime? depTime;
    if (json['estimatedDepartureTime'] is String) {
      depTime = DateTime.tryParse(json['estimatedDepartureTime'] as String);
    }

    return MissedBusRecommendationModel(
      type: json['type'] as String? ?? 'alternative_route',
      busId: json['busId'] as String? ?? '',
      busNumber: json['busNumber'] as String? ?? 'Shuttle',
      routeId: json['routeId'] as String? ?? '',
      routeCode: json['routeCode'] as String? ?? '',
      routeName: json['routeName'] as String? ?? 'Campus Route',
      departureStopId: json['departureStopId'] as String? ?? '',
      departureStopName: json['departureStopName'] as String? ?? 'Nearby Stop',
      etaMinutes: (json['etaMinutes'] as num?)?.toInt() ?? 5,
      estimatedDepartureTime: depTime,
      walkingDistanceMeters: (json['walkingDistanceMeters'] as num?)?.toInt() ?? 0,
      walkingMinutes: (json['walkingMinutes'] as num?)?.toInt() ?? 0,
      advice: json['advice'] as String? ?? 'Proceed to designated platform.',
    );
  }

  @override
  List<Object?> get props => [
        type,
        busId,
        busNumber,
        routeId,
        routeCode,
        departureStopId,
        etaMinutes,
        walkingDistanceMeters,
      ];
}

class MissedBusResponseModel extends Equatable {
  final String originalStopId;
  final List<MissedBusRecommendationModel> recommendations;

  const MissedBusResponseModel({
    required this.originalStopId,
    this.recommendations = const [],
  });

  factory MissedBusResponseModel.fromJson(Map<String, dynamic> json) {
    final list = (json['recommendations'] as List<dynamic>?)
            ?.map((e) => MissedBusRecommendationModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    return MissedBusResponseModel(
      originalStopId: json['originalStopId'] as String? ?? '',
      recommendations: list,
    );
  }

  @override
  List<Object?> get props => [originalStopId, recommendations];
}
