import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/themes/app_theme.dart';
import 'volunteer_dashboard_screen.dart';
import 'volunteer_tasks_screen.dart';
import 'volunteer_map_screen.dart';
import '../widgets/volunteer_drawer.dart';

class VolunteerMainView extends ConsumerStatefulWidget {
  const VolunteerMainView({Key? key}) : super(key: key);

  @override
  ConsumerState<VolunteerMainView> createState() => _VolunteerMainViewState();
}

class _VolunteerMainViewState extends ConsumerState<VolunteerMainView> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const VolunteerDashboardScreen(),
    const VolunteerMapScreen(),
    const VolunteerTasksScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const VolunteerDrawer(),
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        selectedItemColor: AppTheme.primary,
        unselectedItemColor: Colors.grey,
        showUnselectedLabels: true,
        backgroundColor: Colors.white,
        elevation: 10,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), activeIcon: Icon(Icons.dashboard), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.map_outlined), activeIcon: Icon(Icons.map), label: 'Map'),
          BottomNavigationBarItem(icon: Icon(Icons.assignment_outlined), activeIcon: Icon(Icons.assignment), label: 'Tasks'),
        ],
      ),
    );
  }
}
