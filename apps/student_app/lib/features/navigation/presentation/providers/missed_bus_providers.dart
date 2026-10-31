import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/missed_bus_model.dart';
import '../../data/repositories/missed_bus_repository.dart';

class MissedBusQueryArgs extends Equatable {
  final String preferredStopId;
  final String? preferredRouteId;
  final String? destinationStopId;
  final double? studentLatitude;
  final double? studentLongitude;

  const MissedBusQueryArgs({
    required this.preferredStopId,
    this.preferredRouteId,
    this.destinationStopId,
    this.studentLatitude,
    this.studentLongitude,
  });

  @override
  List<Object?> get props => [
        preferredStopId,
        preferredRouteId,
        destinationStopId,
        studentLatitude,
        studentLongitude,
      ];
}

final missedBusRecommendationsProvider =
    FutureProvider.family<MissedBusResponseModel, MissedBusQueryArgs>(
  (ref, args) async {
    final repo = ref.watch(missedBusRepositoryProvider);
    return await repo.getRecommendations(
      preferredStopId: args.preferredStopId,
      preferredRouteId: args.preferredRouteId,
      destinationStopId: args.destinationStopId,
      studentLatitude: args.studentLatitude,
      studentLongitude: args.studentLongitude,
    );
  },
);

/// Active recommendation selected for turn-by-turn walking guidance
final selectedRecommendationProvider =
    StateProvider<MissedBusRecommendationModel?>((ref) => null);
