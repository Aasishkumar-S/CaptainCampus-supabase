import 'package:equatable/equatable.dart';

class LiveLocationModel extends Equatable {
  final String? busId;
  final double latitude;
  final double longitude;
  final double? speed; // in km/h
  final double? heading;
  final double? accuracy;
  final String source; // 'simulator' | 'gps_device' | 'phone_gps' | 'esp32'
  final DateTime timestamp;
  final bool isStale;

  const LiveLocationModel({
    this.busId,
    required this.latitude,
    required this.longitude,
    this.speed,
    this.heading,
    this.accuracy,
    this.source = 'simulator',
    required this.timestamp,
    this.isStale = false,
  });

  bool get isSimulated => source.toLowerCase() == 'simulator';

  factory LiveLocationModel.fromJson(Map<dynamic, dynamic> json, {String? defaultBusId}) {
    final lat = (json['latitude'] as num?)?.toDouble() ?? 0.0;
    final lng = (json['longitude'] as num?)?.toDouble() ?? 0.0;
    final spd = (json['speed'] as num?)?.toDouble();
    final hdg = (json['heading'] as num?)?.toDouble();
    final acc = (json['accuracy'] as num?)?.toDouble();
    final src = json['source'] as String? ?? 'simulator';
    final id = json['busId'] as String? ?? defaultBusId;

    DateTime ts;
    final rawTs = json['timestamp'];
    if (rawTs is int) {
      ts = DateTime.fromMillisecondsSinceEpoch(rawTs);
    } else if (rawTs is String) {
      ts = DateTime.tryParse(rawTs) ?? DateTime.now();
    } else {
      ts = DateTime.now();
    }

    // Default stale threshold: older than 3 minutes (180,000 ms)
    final stale = (json['isStale'] as bool?) ??
        (DateTime.now().difference(ts).inMilliseconds.abs() > 3 * 60 * 1000);

    return LiveLocationModel(
      busId: id,
      latitude: lat,
      longitude: lng,
      speed: spd,
      heading: hdg,
      accuracy: acc,
      source: src,
      timestamp: ts,
      isStale: stale,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (busId != null) 'busId': busId,
      'latitude': latitude,
      'longitude': longitude,
      'speed': speed,
      'heading': heading,
      'accuracy': accuracy,
      'source': source,
      'timestamp': timestamp.toIso8601String(),
      'isStale': isStale,
    };
  }

  LiveLocationModel copyWith({
    String? busId,
    double? latitude,
    double? longitude,
    double? speed,
    double? heading,
    double? accuracy,
    String? source,
    DateTime? timestamp,
    bool? isStale,
  }) {
    return LiveLocationModel(
      busId: busId ?? this.busId,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      speed: speed ?? this.speed,
      heading: heading ?? this.heading,
      accuracy: accuracy ?? this.accuracy,
      source: source ?? this.source,
      timestamp: timestamp ?? this.timestamp,
      isStale: isStale ?? this.isStale,
    );
  }

  @override
  List<Object?> get props => [
        busId,
        latitude,
        longitude,
        speed,
        heading,
        accuracy,
        source,
        timestamp,
        isStale,
      ];
}
