import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/user_model.dart';
import 'dio_client.dart';

class AuthRepository {
  final DioClient _dioClient;
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  AuthRepository(this._dioClient);

  Future<UserModel> login(String email, String password) async {
    try {
      final response = await _dioClient.dio.post(
        '/users/login',
        data: {'email': email, 'password': password},
      );

      final userJson = response.data['data']['user'];
      final accessToken = response.data['data']['accessToken'];
      final refreshToken = response.data['data']['refreshToken'];

      await _secureStorage.write(key: 'accessToken', value: accessToken);
      await _secureStorage.write(key: 'refreshToken', value: refreshToken);

      return UserModel.fromJson(userJson);
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Failed to login');
    }
  }

  Future<UserModel> register({
    required String name,
    required String email,
    required String password,
    required String role,
    String? adminKey,
    List<String>? skills,
  }) async {
    try {
      final data = {
        'name': name,
        'email': email,
        'password': password,
        'role': role,
      };

      if (adminKey != null && adminKey.isNotEmpty) {
        data['adminKey'] = adminKey;
      }
      if (skills != null && skills.isNotEmpty) {
        // Backend expects 'skills' but dio payload needs to just be the list. Map it correctly.
        data['skills'] = skills.join(','); // wait, backend accepts it as a list actually.
      }
      
      // Let's adjust skills to pass as a list
      final Map<String, dynamic> requestData = { ...data };
      if (skills != null && skills.isNotEmpty) {
         requestData['skills'] = skills;
      }

      final response = await _dioClient.dio.post(
        '/users/register',
        data: requestData,
      );

      final userJson = response.data['data']['user'];
      return UserModel.fromJson(userJson);
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Failed to register');
    }
  }

  Future<void> logout() async {
    try {
      await _dioClient.dio.post('/users/logout');
    } catch (e) {
      // Ignored
    } finally {
      await _secureStorage.delete(key: 'accessToken');
      await _secureStorage.delete(key: 'refreshToken');
    }
  }

  Future<UserModel?> getCurrentUser() async {
    final token = await _secureStorage.read(key: 'accessToken');
    if (token == null) return null;

    try {
      final response = await _dioClient.dio.get('/users/profile');
      return UserModel.fromJson(response.data['data']);
    } catch (e) {
      return null;
    }
  }

  Future<void> updatePassword(String oldPassword, String newPassword) async {
    try {
      await _dioClient.dio.post(
        '/users/update-password',
        data: {
          'oldPassword': oldPassword,
          'newPassword': newPassword,
        },
      );
      // Backend clears cookies and invalidates session, so we should clear local storage too
      await _secureStorage.delete(key: 'accessToken');
      await _secureStorage.delete(key: 'refreshToken');
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Failed to update password');
    }
  }

  Future<UserModel> updateAccount(Map<String, dynamic> data) async {
    try {
      final response = await _dioClient.dio.post(
        '/users/update-details',
        data: data,
      );
      return UserModel.fromJson(response.data['data']['user']);
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Failed to update account');
    }
  }
}
