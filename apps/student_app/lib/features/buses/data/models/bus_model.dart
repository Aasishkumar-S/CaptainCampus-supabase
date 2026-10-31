import 'package:equatable/equatable.dart';
import 'live_location_model.dart';

class BusModel extends Equatable {
  final String busId;
  final String busNumber;
  final String? registrationNumber;
  final int capacity;
  final String status; // 'active' | 'inactive' | 'delayed' | 'maintenance'
  final String? currentRouteId;
  final String? driverId;
  final LiveLocationModel? lastLocation;
  final DateTime? updatedAt;

  const BusModel({
    required this.busId,
    required this.busNumber,
    this.registrationNumber,
    this.capacity = 40,
    this.status = 'active',
    this.currentRouteId,
    this.driverId,
    this.lastLocation,
    this.updatedAt,
  });

  bool get isActive => status.toLowerCase() == 'active';
  bool get isDelayed => status.toLowerCase() == 'delayed';
  bool get isMaintenance => status.toLowerCase() == 'maintenance';
  String get displayPlate => registrationNumber ?? 'KA01AA0001';

  factory BusModel.fromJson(Map<String, dynamic> json) {
    return BusModel(
      busId: json['busId'] as String? ?? json['id'] as String? ?? '',
      busNumber: json['busNumber'] as String? ?? '',
      registrationNumber: json['registrationNumber'] as String?,
      capacity: (json['capacity'] as num?)?.toInt() ?? 40,
      status: json['status'] as String? ?? 'active',
      currentRouteId: json['currentRouteId'] as String?,
      driverId: json['driverId'] as String?,
      lastLocation: json['lastLocation'] != null
          ? LiveLocationModel.fromJson(
              json['lastLocation'] as Map<String, dynamic>)
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
      'busId': busId,
      'busNumber': busNumber,
      'registrationNumber': registrationNumber,
      'capacity': capacity,
      'status': status,
      'currentRouteId': currentRouteId,
      'driverId': driverId,
      'lastLocation': lastLocation?.toJson(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  BusModel copyWith({
    String? busId,
    String? busNumber,
    String? registrationNumber,
    int? capacity,
    String? status,
    String? currentRouteId,
    String? driverId,
    LiveLocationModel? lastLocation,
    DateTime? updatedAt,
  }) {
    return BusModel(
      busId: busId ?? this.busId,
      busNumber: busNumber ?? this.busNumber,
      registrationNumber: registrationNumber ?? this.registrationNumber,
      capacity: capacity ?? this.capacity,
      status: status ?? this.status,
      currentRouteId: currentRouteId ?? this.currentRouteId,
      driverId: driverId ?? this.driverId,
      lastLocation: lastLocation ?? this.lastLocation,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [
        busId,
        busNumber,
        registrationNumber,
        capacity,
        status,
        currentRouteId,
        driverId,
        lastLocation,
      ];
}
