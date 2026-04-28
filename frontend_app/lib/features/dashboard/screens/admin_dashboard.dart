import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../widgets/dashboard_layout.dart';

class AdminDashboard extends ConsumerWidget {
  const AdminDashboard({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).value;

    return DashboardLayout(
      title: 'Admin Dashboard',
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      const Icon(Icons.admin_panel_settings, size: 48, color: Colors.blue),
                      const SizedBox(height: 8),
                      Text('Welcome, ${user?.name}', style: Theme.of(context).textTheme.titleLarge),
                      Text('Role: Admin', style: Theme.of(context).textTheme.bodyMedium),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              const Text('System Overview', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              Expanded(
                child: GridView.count(
                  crossAxisCount: 2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  children: [
                    _buildStatCard('Total Users', '1,245', Colors.blue),
                    _buildStatCard('Active Tasks', '34', Colors.orange),
                    _buildStatCard('Reports', '12', Colors.green),
                    _buildStatCard('Alerts', '3', Colors.red),
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, String value, Color color) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(title, style: const TextStyle(fontSize: 14, color: Colors.grey)),
            const SizedBox(height: 8),
            Text(value, style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }
}
