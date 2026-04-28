import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';
import '../providers/worker_provider.dart';
import '../../../core/widgets/custom_textfield.dart';
import '../../../core/widgets/primary_button.dart';
import '../../../core/widgets/loading_overlay.dart';

class ReportIssueScreen extends ConsumerStatefulWidget {
  const ReportIssueScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<ReportIssueScreen> createState() => _ReportIssueScreenState();
}

class _ReportIssueScreenState extends ConsumerState<ReportIssueScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _locationController = TextEditingController();

  void _submit() async {
    if (_formKey.currentState!.validate()) {
      try {
        // Fetch location before submission
        Position? position;
        try {
          bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
          if (serviceEnabled) {
            LocationPermission permission = await Geolocator.checkPermission();
            if (permission == LocationPermission.denied) {
              permission = await Geolocator.requestPermission();
            }
            if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
              position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
            }
          }
        } catch (_) {}

        List<double>? coords;
        if (position != null) {
          coords = [position.longitude, position.latitude];
        }

        await ref.read(workerProvider.notifier).submitManualReport(
              title: _titleController.text,
              rawReportText: _descController.text,
              locationDescription: _locationController.text,
              coordinates: coords,
            );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Issue reported successfully')),
          );
          context.pop();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed: ${e.toString().replaceAll('Exception: ', '')}'),
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final workerState = ref.watch(workerProvider);

    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Report Manual Issue', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: -0.5)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.white),
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
          Positioned(top: -40, right: -40, child: Container(width: 150, height: 150, decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withValues(alpha: 0.1)))),
          
          SafeArea(
            child: LoadingOverlay(
              isLoading: workerState.isLoading,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                    child: Container(
                      padding: const EdgeInsets.all(24.0),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.7),
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 20, offset: const Offset(0, 10))],
                        border: Border.all(color: Colors.white.withValues(alpha: 0.8), width: 1.5),
                      ),
                      child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Provide details about the incident or operational requirement. AI will automatically categorize and prioritize it.',
                    style: TextStyle(color: Colors.black54, fontSize: 14),
                  ),
                  const SizedBox(height: 24),
                  CustomTextField(
                    label: 'Issue Title',
                    hint: 'e.g. Broken Power Line',
                    controller: _titleController,
                    prefixIcon: Icons.title,
                    validator: (v) => v!.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  const Text('Description', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _descController,
                    maxLines: 5,
                    decoration: InputDecoration(
                      hintText: 'Describe the issue clearly...',
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    validator: (v) => v!.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  CustomTextField(
                    label: 'Location Details',
                    hint: 'e.g. Near Main Generator, Sector Alpha',
                    controller: _locationController,
                    prefixIcon: Icons.location_on,
                    validator: (v) => v!.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 32),
                  PrimaryButton(
                    text: 'Submit Report',
                    onPressed: _submit,
                    isLoading: workerState.isLoading,
                  ),
                ],
              ),
            ),
          ),
          ),
          ),
        ),
        ),
        ),
        ],
      ),
    );
  }
}
