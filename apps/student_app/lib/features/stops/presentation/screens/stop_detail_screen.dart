import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';

class StopDetailScreen extends StatelessWidget {
  final String stopId;

  const StopDetailScreen({super.key, required this.stopId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Stop Details'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.pin_drop_rounded,
                            color: AppColors.primary, size: 28),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Campus Stop #$stopId',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    const Text(
                      'Next Expected Shuttles:',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: Icon(Icons.directions_bus, color: AppColors.primary),
                      title: Text('Bus 04 - Route A'),
                      trailing: Text(
                        '4 mins',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const Divider(),
                    const ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: Icon(Icons.directions_bus, color: AppColors.primary),
                      title: Text('Bus 02 - Route B'),
                      trailing: Text(
                        '12 mins',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
