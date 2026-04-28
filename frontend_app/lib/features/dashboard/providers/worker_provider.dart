import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/worker_repository.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/models/task_model.dart';
import 'dart:async';

final workerRepositoryProvider = Provider<WorkerRepository>((ref) {
  return WorkerRepository(ref.watch(dioClientProvider));
});

final workerProvider = AsyncNotifierProvider<WorkerNotifier, void>(() => WorkerNotifier());

class WorkerNotifier extends AsyncNotifier<void> {
  late WorkerRepository _repo;

  @override
  FutureOr<void> build() {
    _repo = ref.watch(workerRepositoryProvider);
  }

  Future<TaskModel> submitManualReport({
    required String title,
    required String rawReportText,
    required String locationDescription,
    List<double>? coordinates,
  }) async {
    state = const AsyncValue.loading();
    try {
      final task = await _repo.createTaskManually(
        title: title,
        rawReportText: rawReportText,
        locationDescription: locationDescription,
        coordinates: coordinates,
      );
      state = const AsyncValue.data(null);
      return task;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  Future<TaskModel> processImageReport(String imagePath) async {
    state = const AsyncValue.loading();
    try {
      final task = await _repo.extractTaskFromImage(imagePath);
      state = const AsyncValue.data(null);
      return task;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  Future<TaskModel> saveConfirmedTask(TaskModel task) async {
    state = const AsyncValue.loading();
    try {
      final savedTask = await _repo.saveTask(task);
      state = const AsyncValue.data(null);
      return savedTask;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  Future<List<TaskModel>> getTasks() async {
    return await _repo.fetchMyTasks();
  }
}

final workerTasksProvider = FutureProvider.autoDispose<List<TaskModel>>((ref) async {
  final repo = ref.watch(workerRepositoryProvider);
  return repo.fetchMyTasks();
});
