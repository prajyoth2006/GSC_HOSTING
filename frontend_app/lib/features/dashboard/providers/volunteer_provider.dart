import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/volunteer_repository.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/models/task_model.dart';
import 'package:geolocator/geolocator.dart';

final volunteerRepositoryProvider = Provider<VolunteerRepository>((ref) {
  return VolunteerRepository(ref.watch(dioClientProvider));
});

final volunteerTasksProvider = FutureProvider.autoDispose<List<TaskModel>>((ref) async {
  final repo = ref.watch(volunteerRepositoryProvider);
  return repo.getAssignedTasks();
});

final volunteerHistoryProvider = FutureProvider.autoDispose<List<TaskModel>>((ref) async {
  final repo = ref.watch(volunteerRepositoryProvider);
  return repo.getHistory();
});

final volunteerProvider = AsyncNotifierProvider<VolunteerNotifier, void>(() => VolunteerNotifier());

class VolunteerNotifier extends AsyncNotifier<void> {
  late VolunteerRepository _repo;

  @override
  FutureOr<void> build() {
    _repo = ref.watch(volunteerRepositoryProvider);
  }

  Future<void> toggleAvailability(bool isAvailable) async {
    state = const AsyncValue.loading();
    try {
      double? lat;
      double? lng;
      if (isAvailable) {
        LocationPermission permission = await Geolocator.checkPermission();
        if (permission == LocationPermission.deniedForever) {
          throw Exception('Location permissions are permanently denied');
        }
        if (permission == LocationPermission.denied) {
          permission = await Geolocator.requestPermission();
          if (permission == LocationPermission.denied) {
            throw Exception('Location permissions are denied');
          }
        }
        Position position = await Geolocator.getCurrentPosition();
        lat = position.latitude;
        lng = position.longitude;
      }

      await _repo.toggleAvailability(isAvailable, lat, lng);
      // to re-fetch if needed
      ref.invalidate(authStateProvider);
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> updateLocation(double lat, double lng) async {
    try {
      await _repo.toggleAvailability(true, lat, lng);
    } catch (e) {
      // Background update, fail silently or log
      debugPrint('Failed to update live location: $e');
    }
  }

  Future<void> updateTaskStatus(String taskId, String status) async {
    state = const AsyncValue.loading();
    try {
      await _repo.updateTaskStatus(taskId, status);
      ref.invalidate(volunteerTasksProvider);
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> addNote(String taskId, String note) async {
    state = const AsyncValue.loading();
    try {
      await _repo.addCompletionNote(taskId, note);
      ref.invalidate(volunteerTasksProvider);
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> escalateTask(String taskId, String reason) async {
    state = const AsyncValue.loading();
    try {
      await _repo.escalateTask(taskId, reason);
      ref.invalidate(volunteerTasksProvider);
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}
