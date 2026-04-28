import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/volunteer_provider.dart';
import '../../../core/themes/app_theme.dart';

class VolunteerDrawer extends ConsumerWidget {
  const VolunteerDrawer({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).value;
    final primary = AppTheme.primary;
    final isOnline = user?.isAvailable == true;

    return Drawer(
      child: Column(
        children: [
          UserAccountsDrawerHeader(
            accountName: Text(user?.name ?? 'Volunteer', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            accountEmail: Text(user?.email ?? '', style: TextStyle(color: Colors.white.withValues(alpha: 0.9))),
            currentAccountPicture: CircleAvatar(
              backgroundColor: Colors.white,
              child: Text(
                user?.name.isNotEmpty == true ? user!.name[0].toUpperCase() : 'V', 
                style: TextStyle(color: primary, fontWeight: FontWeight.w900, fontSize: 24)
              ),
            ),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF0F766E), Color(0xFF14B8A6)], 
                begin: Alignment.topLeft, 
                end: Alignment.bottomRight
              ),
            ),
          ),
          
          ListTile(
            leading: Icon(Icons.dashboard_rounded, color: primary), 
            title: const Text('Dashboard', style: TextStyle(fontWeight: FontWeight.w600)), 
            onTap: () => Navigator.pop(context),
          ),
          
          const Divider(),
          ListTile(
            leading: Icon(Icons.person_outline_rounded, color: primary), 
            title: const Text('My Profile', style: TextStyle(fontWeight: FontWeight.w600)), 
            onTap: () {
              Navigator.pop(context);
              context.push('/profile');
            },
          ),
          ListTile(
            leading: Icon(Icons.settings_outlined, color: primary), 
            title: const Text('Settings', style: TextStyle(fontWeight: FontWeight.w600)), 
            onTap: () => Navigator.pop(context),
          ),
          
          const Spacer(),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout_rounded, color: Colors.red),
            title: const Text('Logout', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
            onTap: () {
              ref.read(authStateProvider.notifier).logout();
              context.go('/login');
            },
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
