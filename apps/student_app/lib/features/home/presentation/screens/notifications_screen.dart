import 'package:flutter/material.dart';
import '../../../../core/widgets/common/empty_state_view.dart';
import '../../../../core/widgets/common/custom_snackbar.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () {
              CustomSnackBar.showInfo(context, 'All notifications marked as read.');
            },
            child: const Text('Mark all read'),
          ),
        ],
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: EmptyStateView(
            title: 'No Notifications Yet',
            description:
                'You are all caught up! Push notifications for approaching shuttles, schedule adjustments, and delays will appear here.',
            icon: Icons.notifications_none_rounded,
          ),
        ),
      ),
    );
  }
}
