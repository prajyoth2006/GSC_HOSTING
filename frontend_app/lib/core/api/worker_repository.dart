import 'dart:io';
import 'dart:convert';
import 'package:dio/dio.dart';
import '../models/task_model.dart';
import 'dio_client.dart';

class WorkerRepository {
  final DioClient _dioClient;

  WorkerRepository(this._dioClient);

  Future<TaskModel> createTaskManually({
    required String title,
    required String rawReportText,
    required String locationDescription,
    List<double>? coordinates,
  }) async {
    try {
      final response = await _dioClient.dio.post(
        '/workers/create-task',
        data: {
          'title': title,
          'rawReportText': rawReportText,
          'locationDescription': locationDescription,
          if (coordinates != null) 'location': { 'type': 'Point', 'coordinates': coordinates },
        },
      );
      
      return TaskModel.fromJson(response.data['data']);
    } on DioException catch (e) {
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        throw Exception(data['message']);
      }
      throw Exception('Server Error ${e.response?.statusCode}: ${data?.toString().substring(0, data.toString().length > 100 ? 100 : data.toString().length)}...');
    }
  }

  Future<TaskModel> extractTaskFromImage(String imagePath) async {
    try {
      final formData = FormData.fromMap({
        'formImage': await MultipartFile.fromFile(
          imagePath,
          filename: 'upload_${DateTime.now().millisecondsSinceEpoch}.jpg',
        ),
      });

      final response = await _dioClient.dio.post(
        '/workers/upload-report',
        data: formData,
      );
      
      final Map<String, dynamic> jsonData = response.data['data'];
      
      return TaskModel.fromJson({
        ...jsonData,
        '_id': 'temp_id', 
        'status': 'Pending',
      });
    } on DioException catch (e) {
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        throw Exception(data['message']);
      }
      throw Exception('Image Analysis Error ${e.response?.statusCode}: ${data?.toString()}');
    } catch (e) {
      throw Exception('Image Analysis Error: $e');
    }
  }

  Future<TaskModel> saveTask(TaskModel task) async {
    try {
      final response = await _dioClient.dio.post(
        '/workers/save-task',
        data: task.toJson(),
      );
      return TaskModel.fromJson(response.data['data']);
    } on DioException catch (e) {
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        throw Exception(data['message']);
      }
      throw Exception('Save Error ${e.response?.statusCode}: $data');
    }
  }

  Future<List<TaskModel>> fetchMyTasks() async {
    try {
      final response = await _dioClient.dio.get('/workers/my-tasks');
      final data = response.data['data'] as List;
      return data.map((json) => TaskModel.fromJson(json)).toList();
    } catch (e) {
      return [];
    }
  }
}
