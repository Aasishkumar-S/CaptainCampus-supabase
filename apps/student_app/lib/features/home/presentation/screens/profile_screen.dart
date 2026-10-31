import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/common/custom_snackbar.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  void _showSignOutDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text(
          'Are you sure you want to sign out of Captain Campus?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
              minimumSize: const Size(100, 40),
            ),
            onPressed: () async {
              Navigator.of(ctx).pop();
              await ref.read(authControllerProvider.notifier).signOut();
              if (context.mounted) {
                CustomSnackBar.showInfo(context, 'Signed out successfully.');
                context.go('/login');
              }
            },
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userProfileAsync = ref.watch(userProfileProvider);
    final user = ref.watch(authStateProvider).value;

    final displayName = userProfileAsync.value?.name ??
        (user?.userMetadata?['display_name'] as String?) ??
        (user?.userMetadata?['name'] as String?) ??
        'Campus Student';
    final email = userProfileAsync.value?.email ??
        user?.email ??
        'student@college.edu';
    final studentId = userProfileAsync.value?.studentId ?? 'STU-2024-001';
    final role = userProfileAsync.value?.role.toUpperCase() ?? 'STUDENT';

    String initials = 'ST';
    if (displayName.trim().isNotEmpty) {
      final parts = displayName.trim().split(' ');
      if (parts.length >= 2) {
        initials = '${parts[0][0]}${parts[1][0]}'.toUpperCase();
      } else {
        initials = parts[0][0].toUpperCase();
      }
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
        child: Column(
          children: [
            // User Header Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 42,
                      backgroundColor: AppColors.primary,
                      child: Text(
                        initials,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      displayName,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      email,
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.primaryContainer,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        'Role: $role  •  ID: $studentId',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primaryDark,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Profile Options
            Card(
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.pin_drop_outlined,
                        color: AppColors.primary),
                    title: const Text('Preferred Stop'),
                    subtitle: const Text('Not set'),
                    trailing: const Icon(Icons.arrow_forward_ios_rounded,
                        size: 16, color: AppColors.textTertiary),
                    onTap: () {
                      context.go('/home/my-stops');
                    },
                  ),
                  const Divider(),
                  ListTile(
                    leading: const Icon(Icons.notifications_active_outlined,
                        color: AppColors.primary),
                    title: const Text('Notification Preferences'),
                    subtitle: const Text('Arrival alerts (10 min prior)'),
                    trailing: const Icon(Icons.arrow_forward_ios_rounded,
                        size: 16, color: AppColors.textTertiary),
                    onTap: () {
                      CustomSnackBar.showInfo(
                          context, 'Notification settings will sync with device');
                    },
                  ),
                  const Divider(),
                  ListTile(
                    leading: const Icon(Icons.privacy_tip_outlined,
                        color: AppColors.primary),
                    title: const Text('Privacy Policy'),
                    trailing: const Icon(Icons.arrow_forward_ios_rounded,
                        size: 16, color: AppColors.textTertiary),
                    onTap: () {
                      CustomSnackBar.showInfo(
                          context, 'Captain Campus collects bus telemetry only.');
                    },
                  ),
                  const Divider(),
                  ListTile(
                    leading: const Icon(Icons.support_agent_outlined,
                        color: AppColors.primary),
                    title: const Text('Support & Contact'),
                    subtitle: const Text('transport@campus.edu'),
                    trailing: const Icon(Icons.arrow_forward_ios_rounded,
                        size: 16, color: AppColors.textTertiary),
                    onTap: () {
                      CustomSnackBar.showInfo(
                          context, 'Contact campus transport desk: ext 404');
                    },
                  ),
                  const Divider(),
                  const ListTile(
                    leading: Icon(Icons.info_outline, color: AppColors.primary),
                    title: Text('App Version'),
                    trailing: Text(
                      '1.0.0 (Build 1)',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // Sign Out Button
            OutlinedButton.icon(
              onPressed: () => _showSignOutDialog(context, ref),
              icon: const Icon(Icons.logout_rounded, color: AppColors.error),
              label: const Text(
                'Sign Out',
                style: TextStyle(
                  color: AppColors.error,
                  fontWeight: FontWeight.w700,
                ),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.error, width: 1.5),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
