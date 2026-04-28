import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/worker_provider.dart';

class FieldWorkerTasksScreen extends ConsumerWidget {
  const FieldWorkerTasksScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasksAsync = ref.watch(workerTasksProvider);

    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('My Assignments', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: -0.5)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: () => ref.refresh(workerTasksProvider),
          )
        ],
      ),
      body: Stack(
        children: [
          Positioned(
            top: 0, left: 0, right: 0, height: 200,
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(colors: [Color(0xFF0F766E), Color(0xFF14B8A6)], begin: Alignment.topLeft, end: Alignment.bottomRight),
                borderRadius: BorderRadius.only(bottomLeft: Radius.circular(40), bottomRight: Radius.circular(40)),
              ),
            ),
          ),
          Positioned(top: -40, left: -40, child: Container(width: 150, height: 150, decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withValues(alpha: 0.1)))),
          
          SafeArea(
            child: tasksAsync.when(
        data: (tasks) {
          if (tasks.isEmpty) {
            return const Center(child: Text('No active assignments found.', style: TextStyle(color: Colors.grey)));
          }
          return RefreshIndicator(
            onRefresh: () async => ref.refresh(workerTasksProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16.0),
              itemCount: tasks.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final task = tasks[index];
                final isUrgent = task.severity >= 4;
                final primaryColor = Theme.of(context).colorScheme.primary;
                return ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                    child: Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.7),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 20, offset: const Offset(0, 5))
                        ],
                        border: Border.all(color: Colors.white.withValues(alpha: 0.8), width: 1.5),
                      ),
                      child: Row(
                        children: [
                      Container(
                        width: 4,
                        height: 48,
                        decoration: BoxDecoration(
                          color: isUrgent ? primaryColor : primaryColor.withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(child: Text(task.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15))),
                                if (isUrgent)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: primaryColor.withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text('URGENT', style: TextStyle(color: primaryColor, fontSize: 10, fontWeight: FontWeight.bold)),
                                  )
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              task.category, 
                              style: TextStyle(color: primaryColor, fontSize: 12, fontWeight: FontWeight.w600)
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Icon(Icons.location_on, size: 14, color: Colors.grey),
                                const SizedBox(width: 4),
                                Expanded(child: Text(task.locationDescription, style: const TextStyle(color: Colors.grey, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                ),
                );
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, st) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, color: Colors.red, size: 48),
              const SizedBox(height: 16),
              Text('Error Loading Tasks:\n$e', textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey)),
            ],
          ),
        ),
      ),
      ),
      ]
     ),
    );
  }
}
