import 'package:equatable/equatable.dart';

class StopModel extends Equatable {
  final String stopId;
  final String stopName;
  final double latitude;
  final double longitude;
  final String? landmark;
  final String? arrivalTime;
  final List<String> routeIds;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const StopModel({
    required this.stopId,
    required this.stopName,
    required this.latitude,
    required this.longitude,
    this.landmark,
    this.arrivalTime,
    this.routeIds = const [],
    this.createdAt,
    this.updatedAt,
  });

  factory StopModel.fromJson(Map<String, dynamic> json) {
    return StopModel(
      stopId: json['stopId'] as String? ?? json['id'] as String? ?? '',
      stopName: json['stopName'] as String? ?? json['name'] as String? ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      landmark: json['landmark'] as String? ??
          json['address'] as String? ??
          json['description'] as String?,
      arrivalTime: json['arrivalTime'] as String?,
      routeIds: (json['routeIds'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      createdAt: json['createdAt'] != null
          ? (json['createdAt'] is String
              ? DateTime.tryParse(json['createdAt'] as String)
              : null)
          : null,
      updatedAt: json['updatedAt'] != null
          ? (json['updatedAt'] is String
              ? DateTime.tryParse(json['updatedAt'] as String)
              : null)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'stopId': stopId,
      'stopName': stopName,
      'latitude': latitude,
      'longitude': longitude,
      'landmark': landmark,
      'arrivalTime': arrivalTime,
      'routeIds': routeIds,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  StopModel copyWith({
    String? stopId,
    String? stopName,
    double? latitude,
    double? longitude,
    String? landmark,
    String? arrivalTime,
    List<String>? routeIds,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return StopModel(
      stopId: stopId ?? this.stopId,
      stopName: stopName ?? this.stopName,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      landmark: landmark ?? this.landmark,
      arrivalTime: arrivalTime ?? this.arrivalTime,
      routeIds: routeIds ?? this.routeIds,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [
        stopId,
        stopName,
        latitude,
        longitude,
        landmark,
        arrivalTime,
        routeIds,
      ];
}
