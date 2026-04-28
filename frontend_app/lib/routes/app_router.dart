import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/providers/auth_provider.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/auth/screens/signup_screen.dart';
import '../features/auth/screens/forgot_password_screen.dart';
import '../features/dashboard/screens/admin_dashboard.dart';
import '../features/dashboard/screens/field_worker_main_view.dart';
import '../features/dashboard/screens/volunteer_main_view.dart';
import '../features/dashboard/screens/report_issue_screen.dart';
import '../features/dashboard/screens/upload_report_screen.dart';
import '../features/dashboard/screens/profile_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final isAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/signup' ||
          state.matchedLocation == '/forgot-password';

      // If auth state is loading, don't redirect yet
      if (authState.isLoading) return null;

      final user = authState.value;

      if (user == null) {
        // If not logged in and not on an auth route, redirect to login
        return isAuthRoute ? null : '/login';
      }

      // User IS logged in
      if (isAuthRoute) {
        return '/dashboard'; // Redirect logged in user away from auth screens
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/signup',
        builder: (context, state) => const SignupScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (context, state) {
          final user = ref.watch(authStateProvider).value;
          if (user == null) {
            return const Scaffold(body: Center(child: CircularProgressIndicator()));
          }

          // Role Map Routing
          switch (user.role) {
            case 'Admin':
              return const AdminDashboard();
            case 'Worker':
              return const FieldWorkerMainView();
            case 'Volunteer':
            default:
              return const VolunteerMainView();
          }
        },
        routes: [
          GoRoute(
            path: 'report-issue',
            builder: (context, state) => const ReportIssueScreen(),
          ),
          GoRoute(
            path: 'upload-report',
            builder: (context, state) => const UploadReportScreen(),
          ),
        ],
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
    ],
  );
});
