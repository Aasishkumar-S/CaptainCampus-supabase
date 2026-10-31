import 'package:equatable/equatable.dart';

class EtaModel extends Equatable {
  final String stopId;
  final String busId;
  final String? tripId;
  final String busNumber;
  final String routeCode;
  final int? etaMinutes;
  final DateTime? estimatedArrivalTime;
  final bool isLiveEstimate;
  final DateTime? lastLocationUpdate;
  final bool isStale;
  final String confidence; // 'high' | 'medium' | 'low' | 'unavailable'
  final String source; // 'calculated' | 'routes_api' | 'timetable'

  const EtaModel({
    required this.stopId,
    required this.busId,
    this.tripId,
    required this.busNumber,
    required this.routeCode,
    this.etaMinutes,
    this.estimatedArrivalTime,
    this.isLiveEstimate = true,
    this.lastLocationUpdate,
    this.isStale = false,
    this.confidence = 'high',
    this.source = 'calculated',
  });

  String get displayEta {
    if (etaMinutes == null) return 'No live ETA';
    if (etaMinutes! <= 0) return 'Arriving now';
    if (etaMinutes == 1) return '1 min';
    return '$etaMinutes mins';
  }

  factory EtaModel.fromJson(Map<String, dynamic> json) {
    DateTime? arrivalTime;
    if (json['estimatedArrivalTime'] is String) {
      arrivalTime = DateTime.tryParse(json['estimatedArrivalTime'] as String);
    }

    DateTime? lastUpdate;
    if (json['lastLocationUpdate'] is int) {
      lastUpdate = DateTime.fromMillisecondsSinceEpoch(
          json['lastLocationUpdate'] as int);
    } else if (json['lastLocationUpdate'] is String) {
      lastUpdate = DateTime.tryParse(json['lastLocationUpdate'] as String);
    }

    return EtaModel(
      stopId: json['stopId'] as String? ?? '',
      busId: json['busId'] as String? ?? '',
      tripId: json['tripId'] as String?,
      busNumber: json['busNumber'] as String? ?? 'Shuttle',
      routeCode: json['routeCode'] as String? ?? '',
      etaMinutes: (json['etaMinutes'] as num?)?.toInt(),
      estimatedArrivalTime: arrivalTime,
      isLiveEstimate: json['isLiveEstimate'] as bool? ?? true,
      lastLocationUpdate: lastUpdate,
      isStale: json['isStale'] as bool? ?? false,
      confidence: json['confidence'] as String? ?? 'high',
      source: json['source'] as String? ?? 'calculated',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'stopId': stopId,
      'busId': busId,
      'tripId': tripId,
      'busNumber': busNumber,
      'routeCode': routeCode,
      'etaMinutes': etaMinutes,
      'estimatedArrivalTime': estimatedArrivalTime?.toIso8601String(),
      'isLiveEstimate': isLiveEstimate,
      'lastLocationUpdate': lastLocationUpdate?.millisecondsSinceEpoch,
      'isStale': isStale,
      'confidence': confidence,
      'source': source,
    };
  }

  @override
  List<Object?> get props => [
        stopId,
        busId,
        tripId,
        busNumber,
        routeCode,
        etaMinutes,
        estimatedArrivalTime,
        isLiveEstimate,
        lastLocationUpdate,
        isStale,
        confidence,
        source,
      ];
}
