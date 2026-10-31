import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/user_model.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});

class AuthRepository {
  final SupabaseClient _supabase;

  AuthRepository({SupabaseClient? supabase})
      : _supabase = supabase ?? Supabase.instance.client;

  User? get currentUser => _supabase.auth.currentUser;

  Stream<AuthState> get authStateChanges => _supabase.auth.onAuthStateChange;

  Future<String?> getIdToken() async {
    return _supabase.auth.currentSession?.accessToken;
  }

  Future<AuthResponse> signInWithEmailPassword(
    String email,
    String password,
  ) async {
    return await _supabase.auth.signInWithPassword(
      email: email.trim(),
      password: password,
    );
  }

  Future<AuthResponse> signUpWithEmailPassword(
    String email,
    String password,
  ) async {
    return await _supabase.auth.signUp(
      email: email.trim(),
      password: password,
    );
  }

  Future<void> signOut() async {
    await _supabase.auth.signOut();
  }

  Future<void> createUserProfile({
    required String uid,
    required String name,
    required String email,
    String? studentId,
  }) async {
    final now = DateTime.now().toIso8601String();
    await _supabase.from('user_profiles').upsert({
      'user_id': uid,
      'name': name,
      'email': email,
      'student_id': studentId,
      'role': 'student',
      'status': 'active',
      'updated_at': now,
    }, onConflict: 'user_id');
  }

  Future<UserModel?> getUserProfile(String uid) async {
    try {
      final response = await _supabase
          .from('user_profiles')
          .select()
          .eq('user_id', uid)
          .single();

      return UserModel.fromJson(response);
    } catch (_) {
      return null;
    }
  }

  Future<void> updateFcmToken(String uid, String token) async {
    try {
      await _supabase.from('user_profiles').update({
        'fcm_token': token,
        'updated_at': DateTime.now().toIso8601String(),
      }).eq('user_id', uid);
    } catch (_) {
      // Ignore token update failures in silent background runs
    }
  }

  Future<void> updatePreferredStop(String uid, String stopId) async {
    try {
      await _supabase.from('user_profiles').update({
        'preferred_stop_id': stopId,
        'updated_at': DateTime.now().toIso8601String(),
      }).eq('user_id', uid);
    } catch (_) {}
  }
}
