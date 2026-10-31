import 'package:equatable/equatable.dart';

class UserModel extends Equatable {
  final String userId;
  final String email;
  final String name;
  final String role; // 'student' | 'driver' | 'admin' | 'dispatcher'
  final String? studentId;
  final String? preferredStopId;
  final String? fcmToken;
  final String? profilePhotoUrl;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const UserModel({
    required this.userId,
    required this.email,
    required this.name,
    this.role = 'student',
    this.studentId,
    this.preferredStopId,
    this.fcmToken,
    this.profilePhotoUrl,
    this.createdAt,
    this.updatedAt,
  });

  factory UserModel.fromMap(Map<String, dynamic> map) => UserModel.fromJson(map);

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      userId: json['userId'] as String? ?? json['user_id'] as String? ?? json['id'] as String? ?? '',
      email: json['email'] as String? ?? '',
      name: json['name'] as String? ?? json['displayName'] as String? ?? '',
      role: json['role'] as String? ?? 'student',
      studentId: json['studentId'] as String? ?? json['student_id'] as String?,
      preferredStopId: json['preferredStopId'] as String? ?? json['preferred_stop_id'] as String?,
      fcmToken: json['fcmToken'] as String? ?? json['fcm_token'] as String?,
      profilePhotoUrl: json['profilePhotoUrl'] as String? ?? json['profile_photo_url'] as String?,
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
      'userId': userId,
      'email': email,
      'name': name,
      'role': role,
      'studentId': studentId,
      'preferredStopId': preferredStopId,
      'fcmToken': fcmToken,
      'profilePhotoUrl': profilePhotoUrl,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  UserModel copyWith({
    String? userId,
    String? email,
    String? name,
    String? role,
    String? studentId,
    String? preferredStopId,
    String? fcmToken,
    String? profilePhotoUrl,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return UserModel(
      userId: userId ?? this.userId,
      email: email ?? this.email,
      name: name ?? this.name,
      role: role ?? this.role,
      studentId: studentId ?? this.studentId,
      preferredStopId: preferredStopId ?? this.preferredStopId,
      fcmToken: fcmToken ?? this.fcmToken,
      profilePhotoUrl: profilePhotoUrl ?? this.profilePhotoUrl,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [
        userId,
        email,
        name,
        role,
        studentId,
        preferredStopId,
        fcmToken,
        profilePhotoUrl,
      ];
}
