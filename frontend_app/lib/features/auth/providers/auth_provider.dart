import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/auth_repository.dart';
import '../../../core/api/dio_client.dart';
import '../../../core/models/user_model.dart';

final dioClientProvider = Provider<DioClient>((ref) => DioClient());

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(dioClientProvider));
});

final authStateProvider = AsyncNotifierProvider<AuthNotifier, UserModel?>(() => AuthNotifier());

class AuthNotifier extends AsyncNotifier<UserModel?> {
  late AuthRepository _authRepository;

  @override
  FutureOr<UserModel?> build() async {
    _authRepository = ref.watch(authRepositoryProvider);
    return _authRepository.getCurrentUser();
  }

  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final user = await _authRepository.login(email, password);
      state = AsyncValue.data(user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
    required String role,
    String? adminKey,
    List<String>? skills,
  }) async {
    state = const AsyncValue.loading();
    try {
      await _authRepository.register(
        name: name,
        email: email,
        password: password,
        role: role,
        adminKey: adminKey,
        skills: skills,
      );
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  Future<void> logout() async {
    state = const AsyncValue.loading();
    await _authRepository.logout();
    state = const AsyncValue.data(null);
  }

  Future<void> updatePassword(String oldPass, String newPass) async {
    await _authRepository.updatePassword(oldPass, newPass);
    state = const AsyncValue.data(null); // Force logout locally
  }

  Future<void> updateAccount(Map<String, dynamic> data) async {
    final updatedUser = await _authRepository.updateAccount(data);
    state = AsyncValue.data(updatedUser);
  }
}
