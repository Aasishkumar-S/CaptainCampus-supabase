import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final localStorageServiceProvider = Provider<LocalStorageService>((ref) {
  return LocalStorageService();
});

class LocalStorageService {
  SharedPreferences? _preferences;

  Future<SharedPreferences> get _instance async {
    _preferences ??= await SharedPreferences.getInstance();
    return _preferences!;
  }

  Future<bool> saveString(String key, String value) async {
    final prefs = await _instance;
    return await prefs.setString(key, value);
  }

  Future<String?> getString(String key) async {
    final prefs = await _instance;
    return prefs.getString(key);
  }

  Future<bool> saveBool(String key, bool value) async {
    final prefs = await _instance;
    return await prefs.setBool(key, value);
  }

  Future<bool?> getBool(String key) async {
    final prefs = await _instance;
    return prefs.getBool(key);
  }

  Future<bool> saveInt(String key, int value) async {
    final prefs = await _instance;
    return await prefs.setInt(key, value);
  }

  Future<int?> getInt(String key) async {
    final prefs = await _instance;
    return prefs.getInt(key);
  }

  Future<bool> remove(String key) async {
    final prefs = await _instance;
    return await prefs.remove(key);
  }

  Future<bool> saveStringList(String key, List<String> value) async {
    final prefs = await _instance;
    return await prefs.setStringList(key, value);
  }

  Future<List<String>> getStringList(String key) async {
    final prefs = await _instance;
    return prefs.getStringList(key) ?? [];
  }

  Future<bool> clear() async {
    final prefs = await _instance;
    return await prefs.clear();
  }
}
