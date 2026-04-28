import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/volunteer_provider.dart';
import '../../../core/themes/app_theme.dart';
import '../../../core/models/task_model.dart';
import '../../../core/widgets/primary_button.dart';
import 'dart:ui';

class VolunteerTaskModal extends ConsumerStatefulWidget {
  final TaskModel task;

  const VolunteerTaskModal({Key? key, required this.task}) : super(key: key);

  @override
  ConsumerState<VolunteerTaskModal> createState() => _VolunteerTaskModalState();
}

class _VolunteerTaskModalState extends ConsumerState<VolunteerTaskModal> {
  final _noteController = TextEditingController();
  final _reasonController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _noteController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _updateStatus(String status) async {
    setState(() => _isLoading = true);
    await ref.read(volunteerProvider.notifier).updateTaskStatus(widget.task.id!, status);
    if (!mounted) return;
    setState(() => _isLoading = false);
    Navigator.pop(context);
  }

  Future<void> _completeTask() async {
    final note = _noteController.text.trim();
    
    setState(() => _isLoading = true);
    
    // 1. Update status to completed
    await ref.read(volunteerProvider.notifier).updateTaskStatus(widget.task.id!, 'Completed');
    
    // 2. ONLY add a note if they optionally typed one in
    if (note.isNotEmpty) {
      await ref.read(volunteerProvider.notifier).addNote(widget.task.id!, note);
    }
    
    if (!mounted) return;
    setState(() => _isLoading = false);
    Navigator.pop(context);
  }

  Future<void> _escalateTask() async {
    final reason = _reasonController.text.trim();
    if (reason.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please provide a reason for escalation')));
      return;
    }
    setState(() => _isLoading = true);
    await ref.read(volunteerProvider.notifier).escalateTask(widget.task.id!, reason);
    if (!mounted) return;
    setState(() => _isLoading = false);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.9),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white, width: 2),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: SingleChildScrollView(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              top: 24,
              left: 24,
              right: 24,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  widget.task.title,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 8),
                Text(
                  widget.task.rawReportText,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 16),
                const Divider(),
                if (widget.task.status == 'Pending' || widget.task.status == 'Matched')
                  PrimaryButton(
                    text: 'Start Task (In Progress)',
                    onPressed: () { _updateStatus('In Progress'); },
                    isLoading: _isLoading,
                  ),
                if (widget.task.status == 'In Progress') ...[
                  TextField(
                    controller: _noteController,
                    decoration: const InputDecoration(labelText: 'Completion Note (Optional)'),
                    maxLines: 2,
                  ),
                  const SizedBox(height: 16),
                  PrimaryButton(
                    text: 'Mark as Completed',
                    onPressed: () { _completeTask(); },
                    isLoading: _isLoading,
                  ),
                  const SizedBox(height: 8),
                  const Divider(),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _reasonController,
                    decoration: const InputDecoration(labelText: 'Reason for Escalation (SOS)'),
                    maxLines: 2,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error),
                    onPressed: _isLoading ? null : () { _escalateTask(); },
                    child: const Text('Escalate Task', style: TextStyle(color: Colors.white)),
                  ),
                ],
                if (widget.task.status == 'Completed')
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16.0),
                    child: Text('This task is already completed.', textAlign: TextAlign.center, style: TextStyle(color: AppTheme.success, fontWeight: FontWeight.bold)),
                  ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
