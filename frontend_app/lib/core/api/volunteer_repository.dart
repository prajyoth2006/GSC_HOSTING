import 'package:dio/dio.dart';
import '../models/task_model.dart';
import 'dio_client.dart';

class VolunteerRepository {
  final DioClient _dioClient;

  VolunteerRepository(this._dioClient);

  Future<void> toggleAvailability(bool isAvailable, double? lat, double? lng) async {
    try {
      final data = {
        'isAvailable': isAvailable,
        if (lat != null && lng != null) 'coordinates': [lng, lat],
      };
      await _dioClient.dio.patch('/volunteers/availability', data: data);
    } catch (e) {
      _handleError(e);
    }
  }

  Future<List<TaskModel>> getAssignedTasks() async {
    try {
      final response = await _dioClient.dio.get('/volunteers/my-assignments');
      final data = response.data['data'] as List;
      return data.map((json) => TaskModel.fromJson(json)).toList();
    } catch (e) {
      return [];
    }
  }

  Future<void> updateTaskStatus(String taskId, String status) async {
    try {
      await _dioClient.dio.patch(
        '/volunteers/tasks/$taskId/status',
        data: {'status': status},
      );
    } catch (e) {
      _handleError(e, 'Failed to update task status');
    }
  }

  Future<void> addCompletionNote(String taskId, String note) async {
    try {
      await _dioClient.dio.patch(
        '/volunteers/tasks/$taskId/note',
        data: {'note': note},
      );
    } catch (e) {
      _handleError(e, 'Failed to add completion note');
    }
  }

  Future<void> escalateTask(String taskId, String reason) async {
    try {
      await _dioClient.dio.patch(
        '/volunteers/tasks/$taskId/escalate',
        data: {'reason': reason},
      );
    } catch (e) {
      _handleError(e, 'Failed to escalate task');
    }
  }

  Future<List<TaskModel>> getHistory() async {
    try {
      final response = await _dioClient.dio.get('/volunteers/history');
      final data = response.data['data'] as List;
      return data.map((json) => TaskModel.fromJson(json)).toList();
    } catch (e) {
      return [];
    }
  }

  void _handleError(Object e, [String defaultMsg = 'Error occurred']) {
    if (e is DioException) {
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        throw Exception(data['message']);
      }
      throw Exception('$defaultMsg: ${e.response?.statusCode} - $data');
    }
    throw Exception('$defaultMsg: $e');
  }
}
