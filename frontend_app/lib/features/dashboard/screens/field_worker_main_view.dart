import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'field_worker_dashboard.dart';
import 'field_worker_tasks_screen.dart';
import 'field_worker_report_menu.dart';

class FieldWorkerMainView extends StatefulWidget {
  const FieldWorkerMainView({Key? key}) : super(key: key);

  @override
  State<FieldWorkerMainView> createState() => _FieldWorkerMainViewState();
}

class _FieldWorkerMainViewState extends State<FieldWorkerMainView> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const FieldWorkerDashboard(),
    const FieldWorkerReportMenu(),
    const FieldWorkerTasksScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (val) {
          if (val != _currentIndex) {
            setState(() => _currentIndex = val);
          }
        },
        selectedItemColor: Theme.of(context).colorScheme.primary,
        unselectedItemColor: Colors.grey.shade400,
        backgroundColor: Colors.white,
        elevation: 10,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), activeIcon: Icon(Icons.dashboard), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.add_circle_outline), activeIcon: Icon(Icons.add_circle), label: 'Report'),
          BottomNavigationBarItem(icon: Icon(Icons.assignment_outlined), activeIcon: Icon(Icons.assignment), label: 'Tasks'),
        ],
      ),
    );
  }
}
