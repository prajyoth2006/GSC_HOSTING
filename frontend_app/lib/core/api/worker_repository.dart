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
      final apiKey = 'AIzaSyC9GzCl0UTTFkkSeWb6Vsd4mSBcX6z5mdU';
      final fileBytes = await File(imagePath).readAsBytes();
      final base64Image = base64Encode(fileBytes);
      
      String mimeType = 'image/jpeg';
      if (imagePath.toLowerCase().endsWith('.png')) mimeType = 'image/png';

      final geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$apiKey';

      final prompt = '''
          You are an expert data extractor assisting in disaster response and community management.
          Analyze this handwritten field report. 
          Extract the problem details and return ONLY a valid JSON object. Do not include markdown formatting like ```json.
          
          Expected JSON structure:
          {
              "title": "A short, punchy summary of the crisis",
              "rawReportText": "A complete, word-for-word transcription of the handwritten text in the image",
              "category": "You MUST categorize this into exactly ONE of the following: 'Medical', 'Rescue', 'Food & Water', 'Shelter', 'Sanitation', 'Labor', 'Transport', 'Supplies', 'Animal Rescue', 'Infrastructure', 'Other'",
              "severity": Analyze the urgency and return a single integer between 1 and 5,
              "requiredSkills": ["Skill 1", "Skill 2"],
              "locationDescription": "The exact, detailed description of the location as mentioned in the text (e.g., 'Intersection of hostel Arya Bhatta and Kalam, IIT Patna').",
              "location": {
                  "type": "Point",
                  "coordinates": [0, 0] 
              }
          }
      ''';

      final requestData = {
        "contents": [
          {
            "parts": [
              {"text": prompt},
              {
                "inlineData": {
                  "mimeType": mimeType,
                  "data": base64Image
                }
              }
            ]
          }
        ],
        "generationConfig": {
          "temperature": 0.2
        }
      };

      final response = await Dio().post(
        geminiUrl,
        data: requestData,
        options: Options(headers: {"Content-Type": "application/json"}),
      );
      
      if (response.statusCode == 200) {
        final contentText = response.data['candidates'][0]['content']['parts'][0]['text'] as String;
        final cleanJsonStr = contentText.replaceAll('```json', '').replaceAll('```', '').trim();
        final Map<String, dynamic> jsonData = jsonDecode(cleanJsonStr);
        
        return TaskModel.fromJson({
          ...jsonData,
          '_id': 'temp_id', 
          'status': 'Pending',
        });
      } else {
        throw Exception("Failed to analyze image with Gemini");
      }
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
