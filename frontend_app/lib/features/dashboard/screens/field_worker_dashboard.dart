import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../auth/providers/auth_provider.dart';
import '../widgets/dashboard_layout.dart';

class FieldWorkerDashboard extends ConsumerWidget {
  const FieldWorkerDashboard({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).value;
    final primary = Theme.of(context).colorScheme.primary;

    return Scaffold(
      extendBodyBehindAppBar: true, 
      backgroundColor: Theme.of(context).colorScheme.background,
      drawer: Drawer(
        child: Column(
          children: [
            UserAccountsDrawerHeader(
              accountName: Text(user?.name ?? 'Worker'),
              accountEmail: Text(user?.email ?? ''),
              currentAccountPicture: CircleAvatar(
                backgroundColor: Colors.white,
                child: Text(user?.name.isNotEmpty == true ? user!.name[0].toUpperCase() : 'W', style: TextStyle(color: primary, fontWeight: FontWeight.bold, fontSize: 24)),
              ),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [primary, const Color(0xFF14B8A6)], begin: Alignment.topLeft, end: Alignment.bottomRight),
              ),
            ),
            ListTile(leading: Icon(Icons.dashboard, color: primary), title: const Text('Dashboard'), onTap: () => context.pop()),
            ListTile(
              leading: Icon(Icons.person_outline, color: primary), 
              title: const Text('My Profile'), 
              onTap: () {
                context.pop();
                context.push('/profile');
              }
            ),
            ListTile(leading: Icon(Icons.assignment, color: primary), title: const Text('My Tasks'), onTap: () => context.pop()),
            ListTile(leading: Icon(Icons.settings, color: primary), title: const Text('Settings'), onTap: () => context.pop()),
            const Spacer(),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.red),
              title: const Text('Logout', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
              onTap: () {
                ref.read(authStateProvider.notifier).logout();
                context.go('/login');
              },
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16, top: 12, bottom: 12),
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2), 
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withValues(alpha: 0.5)),
            ),
            child: const Center(child: Text('OPERATIVE', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.5))),
          )
        ],
      ),
      body: Stack(
        children: [
          // Background Gradient Geometry
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 320,
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF0F766E), Color(0xFF14B8A6)], 
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.only(bottomLeft: Radius.circular(60), bottomRight: Radius.circular(60)),
              ),
            ),
          ),
          // Decorator Circles
          Positioned(
            top: -50,
            right: -50,
            child: Container(width: 200, height: 200, decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withValues(alpha: 0.1))),
          ),
          
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20.0),
              physics: const BouncingScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 10),
                  Text('Hello, ${user?.name.split(' ').first ?? 'Worker'}', style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w900, letterSpacing: -1)),
                  const SizedBox(height: 6),
                  Text('System Online. Grid Synced.', style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 14, fontWeight: FontWeight.w500)),
                  
                  const SizedBox(height: 40),
                  
                  // Premium Glassmorphism Overview Card
                  _buildGlassCard(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Today\'s Overview', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
                              Icon(Icons.blur_on_rounded, color: primary.withValues(alpha: 0.5)),
                            ],
                          ),
                          const SizedBox(height: 24),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              _buildGlassStatItem('Critical', '0', Icons.warning_rounded, primary),
                              Container(height: 50, width: 1, color: Colors.grey.shade300),
                              _buildGlassStatItem('Pending', 'Clear', Icons.cloud_done_rounded, primary),
                              Container(height: 50, width: 1, color: Colors.grey.shade300),
                              _buildGlassStatItem('Distance', '1.2km', Icons.directions_walk_rounded, primary),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 32),
                  const Text('Recent Activity', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
                  const SizedBox(height: 16),
                  
                  _buildGlassCard(
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(32.0),
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: primary.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(Icons.check_circle_rounded, size: 48, color: primary),
                          ),
                          const SizedBox(height: 20),
                          const Text('You\'re all caught up.', style: TextStyle(color: Color(0xFF64748B), fontSize: 16, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildGlassCard({required Widget child}) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(32),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.6), // Frosted glass overlay
            borderRadius: BorderRadius.circular(32),
            border: Border.all(color: Colors.white.withValues(alpha: 0.9), width: 1.5),
            boxShadow: [
              BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 30, offset: const Offset(0, 15))
            ],
          ),
          child: child,
        ),
      ),
    );
  }

  Widget _buildGlassStatItem(String title, String value, IconData icon, Color color) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: [BoxShadow(color: color.withValues(alpha: 0.1), blurRadius: 10, offset: const Offset(0,5))]),
          child: Icon(icon, color: color, size: 24),
        ),
        const SizedBox(height: 12),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Color(0xFF0F172A))),
        const SizedBox(height: 4),
        Text(title, style: const TextStyle(color: Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w600)),
      ],
    );
  }
}
