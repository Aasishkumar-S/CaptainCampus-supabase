class AppConstants {
  AppConstants._();

  static const String appName = 'Captain Campus';
  static const String apiBaseUrl = 'http://10.0.2.2:4000/api/v1'; // Android emulator localhost

  // GPS
  static const int gpsStaleThresholdMs = 3 * 60 * 1000; // 3 minutes
  static const int etaCacheTtlMs = 30 * 1000; // 30 seconds

  // Missed bus
  static const int missedBusWaitWindowMinutes = 15;
  static const int maxWalkingDistanceMeters = 800;

  // Simulator
  static const int simulatorUpdateIntervalMs = 5000;

  // Notification channel
  static const String notificationChannelId = 'captain_campus_notifications';
  static const String notificationChannelName = 'Captain Campus Alerts';

  // Supabase Configuration
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://your-project-ref.supabase.co',
  );
  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'your-anon-key',
  );

  // Demo mode
  static const bool demoModeAvailable = true; // Set false for production
}
