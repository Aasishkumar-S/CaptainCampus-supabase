import 'package:equatable/equatable.dart';

class RouteStopReference extends Equatable {
  final String stopId;
  final int sequence;
  final String? scheduledTime; // e.g. "08:15" or offset
  final int? scheduledOffset;

  const RouteStopReference({
    required this.stopId,
    required this.sequence,
    this.scheduledTime,
    this.scheduledOffset,
  });

  factory RouteStopReference.fromJson(Map<String, dynamic> json) {
    final offset = (json['scheduledOffset'] as num?)?.toInt();
    final time = json['scheduledTime'] as String? ??
        (offset != null ? '+$offset min' : null);

    return RouteStopReference(
      stopId: json['stopId'] as String? ?? '',
      sequence: (json['sequence'] as num?)?.toInt() ?? 0,
      scheduledTime: time,
      scheduledOffset: offset,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'stopId': stopId,
      'sequence': sequence,
      'scheduledTime': scheduledTime,
      if (scheduledOffset != null) 'scheduledOffset': scheduledOffset,
    };
  }

  @override
  List<Object?> get props => [stopId, sequence, scheduledTime, scheduledOffset];
}

class RouteModel extends Equatable {
  final String routeId;
  final String routeNumber; // e.g. "R1"
  final String routeName;
  final String? startPoint;
  final String? endPoint;
  final List<RouteStopReference> stops;
  final String? polyline;
  final String? color; // e.g. "#1565C0"
  final String? direction; // 'inbound' | 'outbound' | 'circular'
  final int? estimatedDuration;
  final bool isActive;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const RouteModel({
    required this.routeId,
    required this.routeNumber,
    required this.routeName,
    this.startPoint,
    this.endPoint,
    this.stops = const [],
    this.polyline,
    this.color,
    this.direction,
    this.estimatedDuration,
    this.isActive = true,
    this.createdAt,
    this.updatedAt,
  });

  factory RouteModel.fromJson(Map<String, dynamic> json) {
    var rawStops = json['stops'] ?? json['stopSequence'];
    List<RouteStopReference> stopsList = [];
    if (rawStops is List) {
      stopsList = rawStops
          .map((s) => RouteStopReference.fromJson(s as Map<String, dynamic>))
          .toList();
    }

    final status = json['status'] as String?;
    final active = json['isActive'] as bool? ?? (status == null || status == 'active');

    return RouteModel(
      routeId: json['routeId'] as String? ?? json['id'] as String? ?? '',
      routeNumber: json['routeNumber'] as String? ??
          json['routeCode'] as String? ??
          '',
      routeName: json['routeName'] as String? ?? json['name'] as String? ?? '',
      startPoint: json['startPoint'] as String? ?? json['originStopId'] as String?,
      endPoint: json['endPoint'] as String? ?? json['destinationStopId'] as String?,
      stops: stopsList,
      polyline: json['polyline'] as String?,
      color: json['color'] as String?,
      direction: json['direction'] as String?,
      estimatedDuration: (json['estimatedDuration'] as num?)?.toInt(),
      isActive: active,
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
      'routeId': routeId,
      'routeNumber': routeNumber,
      'routeName': routeName,
      'startPoint': startPoint,
      'endPoint': endPoint,
      'stops': stops.map((s) => s.toJson()).toList(),
      'polyline': polyline,
      'color': color,
      'direction': direction,
      'estimatedDuration': estimatedDuration,
      'isActive': isActive,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  RouteModel copyWith({
    String? routeId,
    String? routeNumber,
    String? routeName,
    String? startPoint,
    String? endPoint,
    List<RouteStopReference>? stops,
    String? polyline,
    String? color,
    String? direction,
    int? estimatedDuration,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return RouteModel(
      routeId: routeId ?? this.routeId,
      routeNumber: routeNumber ?? this.routeNumber,
      routeName: routeName ?? this.routeName,
      startPoint: startPoint ?? this.startPoint,
      endPoint: endPoint ?? this.endPoint,
      stops: stops ?? this.stops,
      polyline: polyline ?? this.polyline,
      color: color ?? this.color,
      direction: direction ?? this.direction,
      estimatedDuration: estimatedDuration ?? this.estimatedDuration,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [
        routeId,
        routeNumber,
        routeName,
        startPoint,
        endPoint,
        stops,
        polyline,
        color,
        direction,
        estimatedDuration,
        isActive,
      ];
}
