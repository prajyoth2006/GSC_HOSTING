import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'dart:io';
import 'package:flutter/foundation.dart';

class DioClient {
  // Production URL
  static String get baseUrl {
    return 'https://gsc-backend-2026.onrender.com/api/v1';
  }
  final Dio dio;
  final FlutterSecureStorage secureStorage = const FlutterSecureStorage();

  DioClient() : dio = Dio(BaseOptions(baseUrl: baseUrl, headers: {"Content-Type": "application/json"})) {
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final accessToken = await secureStorage.read(key: 'accessToken');
        if (accessToken != null) {
          options.headers['Authorization'] = 'Bearer $accessToken';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) async {
        if (e.response?.statusCode == 401) {
          final isRefreshed = await _refreshToken();
          if (isRefreshed) {
            // Retry request
            return handler.resolve(await _retry(e.requestOptions));
          }
        }
        return handler.next(e);
      },
    ));
  }

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await secureStorage.read(key: 'refreshToken');
      if (refreshToken == null) return false;

      final response = await Dio(BaseOptions(baseUrl: baseUrl)).post(
        '/users/refresh-token',
        data: {'refreshToken': refreshToken},
      );

      if (response.statusCode == 200) {
        final newAccessToken = response.data['data']['accessToken'];
        final newRefreshToken = response.data['data']['refreshToken'];
        
        await secureStorage.write(key: 'accessToken', value: newAccessToken);
        await secureStorage.write(key: 'refreshToken', value: newRefreshToken);
        return true;
      }
    } catch (e) {
      // Clear tokens on failed refresh
      await secureStorage.delete(key: 'accessToken');
      await secureStorage.delete(key: 'refreshToken');
    }
    return false;
  }

  Future<Response<dynamic>> _retry(RequestOptions requestOptions) async {
    final options = Options(
      method: requestOptions.method,
      headers: requestOptions.headers,
    );
    final accessToken = await secureStorage.read(key: 'accessToken');
    if (accessToken != null) {
        options.headers?['Authorization'] = 'Bearer $accessToken';
    }
    return dio.request<dynamic>(
      requestOptions.path,
      data: requestOptions.data,
      queryParameters: requestOptions.queryParameters,
      options: options,
    );
  }
}
