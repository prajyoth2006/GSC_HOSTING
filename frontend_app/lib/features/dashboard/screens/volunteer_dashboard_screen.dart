import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import '../providers/volunteer_provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/models/task_model.dart';
import '../../../core/themes/app_theme.dart';
import '../widgets/volunteer_drawer.dart';

class VolunteerDashboardScreen extends ConsumerWidget {
  const VolunteerDashboardScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).value;
    final tasksAsync = ref.watch(volunteerTasksProvider);
    final primary = AppTheme.primary;

    return Scaffold(
      extendBodyBehindAppBar: true, 
      backgroundColor: const Color(0xFFF8FAFC),
      drawer: VolunteerDrawer(),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu, color: Colors.white),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16, top: 12, bottom: 12),
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2), 
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withValues(alpha: 0.5)),
            ),
            child: const Center(child: Text('VOLUNTEER', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.5))),
          )
        ],
      ),
      body: Stack(
        children: [
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 350,
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
          Positioned(
            top: -50,
            right: -50,
            child: Container(width: 200, height: 200, decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withValues(alpha: 0.1))),
          ),
          
          SafeArea(
            child: tasksAsync.when(
              data: (tasks) {
                final inProgress = tasks.where((t) => t.status == 'In Progress').length;
                final pending = tasks.where((t) => t.status == 'Pending').length;
                final critical = tasks.where((t) => t.severity >= 4).length;

                return SingleChildScrollView(
                  padding: const EdgeInsets.all(20.0),
                  physics: const BouncingScrollPhysics(),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 10),
                      Text('Welcome, ${user?.name.split(' ').first ?? 'Volunteer'}', style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w900, letterSpacing: -1)),
                      const SizedBox(height: 6),
                      Text('Thank you for making a difference today.', style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 14, fontWeight: FontWeight.w500)),
                      
                      const SizedBox(height: 40),
                      
                      _buildGlassCard(
                        child: Padding(
                          padding: const EdgeInsets.all(24.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('My Impact Overview', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
                                  Icon(Icons.volunteer_activism, color: primary.withValues(alpha: 0.5)),
                                ],
                              ),
                              const SizedBox(height: 24),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceAround,
                                children: [
                                  _buildGlassStatItem('Pending', pending.toString(), Icons.assignment_late_rounded, primary),
                                  Container(height: 50, width: 1, color: Colors.grey.shade300),
                                  _buildGlassStatItem('Active', inProgress.toString(), Icons.autorenew_rounded, Colors.blue),
                                  Container(height: 50, width: 1, color: Colors.grey.shade300),
                                  _buildGlassStatItem('Critical', critical.toString(), Icons.warning_rounded, Colors.orange),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 32),
                      const Text('Tasks by Category', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
                      const SizedBox(height: 16),
                      
                      _buildGlassCard(
                        child: Container(
                          height: 250,
                          padding: const EdgeInsets.all(24.0),
                          child: tasks.isEmpty 
                            ? const Center(child: Text("No tasks available to graph")) 
                            : _buildPieChart(tasks),
                        ),
                      ),

                      const SizedBox(height: 32),
                      const Text('Tasks by Severity', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
                      const SizedBox(height: 16),
                      
                      _buildGlassCard(
                        child: Container(
                          height: 250,
                          padding: const EdgeInsets.all(24.0),
                          child: tasks.isEmpty 
                            ? const Center(child: Text("No tasks available to graph")) 
                            : _buildBarChart(tasks),
                        ),
                      ),

                      const SizedBox(height: 32),
                    ],
                  ),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator(color: Colors.white)),
              error: (e, st) => Center(child: Text('Error loading stats: $e', style: const TextStyle(color: Colors.red))),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildPieChart(List<TaskModel> tasks) {
    Map<String, int> categoryCounts = {};
    for (var t in tasks) {
      categoryCounts[t.category] = (categoryCounts[t.category] ?? 0) + 1;
    }

    List<Color> colors = [AppTheme.primary, Colors.blue, Colors.orange, Colors.red, Colors.purple, Colors.teal];
    
    List<PieChartSectionData> sections = [];
    int colorIndex = 0;
    
    categoryCounts.forEach((key, value) {
      sections.add(
        PieChartSectionData(
          color: colors[colorIndex % colors.length],
          value: value.toDouble(),
          title: '$key\n$value',
          radius: 60,
          titleStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
        ),
      );
      colorIndex++;
    });

    return PieChart(
      PieChartData(
        sectionsSpace: 2,
        centerSpaceRadius: 40,
        sections: sections,
      ),
    );
  }

  Widget _buildBarChart(List<TaskModel> tasks) {
    Map<int, int> severityCounts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
    for (var t in tasks) {
      if (severityCounts.containsKey(t.severity)) {
        severityCounts[t.severity] = severityCounts[t.severity]! + 1;
      }
    }

    List<BarChartGroupData> barGroups = severityCounts.entries.map((e) {
      return BarChartGroupData(
        x: e.key,
        barRods: [
          BarChartRodData(
            toY: e.value.toDouble(),
            color: e.key >= 4 ? Colors.red : (e.key == 3 ? Colors.orange : AppTheme.primary),
            width: 20,
            borderRadius: BorderRadius.circular(4),
          )
        ],
      );
    }).toList();

    return BarChart(
      BarChartData(
        alignment: BarChartAlignment.spaceAround,
        maxY: (severityCounts.values.reduce((a, b) => a > b ? a : b) + 2).toDouble(),
        barTouchData: BarTouchData(enabled: false),
        titlesData: FlTitlesData(
          show: true,
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) => Text('Sev ${value.toInt()}', style: const TextStyle(fontSize: 10)),
            ),
          ),
          leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        gridData: const FlGridData(show: false),
        borderData: FlBorderData(show: false),
        barGroups: barGroups,
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
            color: Colors.white.withValues(alpha: 0.8), // more opaque for charts
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
