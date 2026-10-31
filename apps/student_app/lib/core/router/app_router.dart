import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/onboarding_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/auth/presentation/screens/splash_screen.dart';
import '../../features/buses/presentation/screens/bus_detail_screen.dart';
import '../../features/home/presentation/screens/dashboard_screen.dart';
import '../../features/home/presentation/screens/live_map_screen.dart';
import '../../features/home/presentation/screens/main_shell_screen.dart';
import '../../features/home/presentation/screens/my_stops_screen.dart';
import '../../features/home/presentation/screens/notifications_screen.dart';
import '../../features/home/presentation/screens/profile_screen.dart';
import '../../features/navigation/presentation/screens/missed_bus_screen.dart';
import '../../features/navigation/presentation/screens/walking_directions_screen.dart';
import '../../features/stops/presentation/screens/stop_detail_screen.dart';

final rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorDashboardKey = GlobalKey<NavigatorState>(debugLabel: 'shellDashboard');
final _shellNavigatorLiveMapKey = GlobalKey<NavigatorState>(debugLabel: 'shellLiveMap');
final _shellNavigatorMyStopsKey = GlobalKey<NavigatorState>(debugLabel: 'shellMyStops');
final _shellNavigatorNotificationsKey = GlobalKey<NavigatorState>(debugLabel: 'shellNotifications');
final _shellNavigatorProfileKey = GlobalKey<NavigatorState>(debugLabel: 'shellProfile');

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/splash',
    redirect: (context, state) {
      final isLoading = authState.isLoading;
      final isAuthenticated = authState.value != null;
      final currentPath = state.matchedLocation;

      // When splash is actively displaying, let it control the initial flow
      if (currentPath == '/splash') {
        return null;
      }

      if (isLoading) {
        return null;
      }

      final isAuthRoute = currentPath == '/login' ||
          currentPath == '/register' ||
          currentPath == '/onboarding';

      // Redirect unauthenticated user trying to access protected shell
      if (!isAuthenticated && !isAuthRoute) {
        return '/login';
      }

      // Redirect authenticated user away from login / register
      if (isAuthenticated && isAuthRoute) {
        return '/home/dashboard';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),

      // Stateful shell route for bottom navigation
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return MainShellScreen(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            navigatorKey: _shellNavigatorDashboardKey,
            routes: [
              GoRoute(
                path: '/home/dashboard',
                builder: (context, state) => const DashboardScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _shellNavigatorLiveMapKey,
            routes: [
              GoRoute(
                path: '/home/live-map',
                builder: (context, state) => const LiveMapScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _shellNavigatorMyStopsKey,
            routes: [
              GoRoute(
                path: '/home/my-stops',
                builder: (context, state) => const MyStopsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _shellNavigatorNotificationsKey,
            routes: [
              GoRoute(
                path: '/home/notifications',
                builder: (context, state) => const NotificationsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _shellNavigatorProfileKey,
            routes: [
              GoRoute(
                path: '/home/profile',
                builder: (context, state) => const ProfileScreen(),
              ),
            ],
          ),
        ],
      ),

      // Detail and feature routes
      GoRoute(
        path: '/bus/:busId',
        builder: (context, state) {
          final busId = state.pathParameters['busId'] ?? '';
          return BusDetailScreen(busId: busId);
        },
      ),
      GoRoute(
        path: '/stop/:stopId',
        builder: (context, state) {
          final stopId = state.pathParameters['stopId'] ?? '';
          return StopDetailScreen(stopId: stopId);
        },
      ),
      GoRoute(
        path: '/missed-bus',
        builder: (context, state) => const MissedBusScreen(),
      ),
      GoRoute(
        path: '/walking-directions',
        builder: (context, state) => const WalkingDirectionsScreen(),
      ),
    ],
  );
});
