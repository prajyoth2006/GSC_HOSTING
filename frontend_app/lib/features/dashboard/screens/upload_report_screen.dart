import 'dart:io';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:go_router/go_router.dart';
import '../providers/worker_provider.dart';
import '../../../core/models/task_model.dart';
import '../../../core/widgets/primary_button.dart';
import '../../../core/widgets/loading_overlay.dart';

class UploadReportScreen extends ConsumerStatefulWidget {
  const UploadReportScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<UploadReportScreen> createState() => _UploadReportScreenState();
}

class _UploadReportScreenState extends ConsumerState<UploadReportScreen> {
  File? _image;
  TaskModel? _extractedTask;
  final ImagePicker _picker = ImagePicker();

  Future<void> _pickImage(ImageSource source) async {
    final pickedFile = await _picker.pickImage(source: source);
    if (pickedFile != null) {
      setState(() {
        _image = File(pickedFile.path);
        _extractedTask = null; // reset if new image
      });
      _analyzeImage(); // Trigger automatically
    }
  }

  void _analyzeImage() async {
    if (_image == null) return;
    try {
      final task = await ref.read(workerProvider.notifier).processImageReport(_image!.path);
      setState(() {
        _extractedTask = task;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
    }
  }

  void _confirmAndSave() async {
    if (_extractedTask == null) return;
    try {
      await ref.read(workerProvider.notifier).saveConfirmedTask(_extractedTask!);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Task registered successfully')),
        );
        context.pop();
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final workerState = ref.watch(workerProvider);

    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Capture Field Report', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: -0.5)),
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
                      child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_image == null) ...[
                  const Text(
                    'Upload a photo of a handwritten field report. Gemini AI will automatically extract the details and geolocate the incident.',
                    style: TextStyle(color: Colors.black54, fontSize: 14),
                  ),
                  const SizedBox(height: 32),
                  GestureDetector(
                    onTap: () => _pickImage(ImageSource.camera),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 40),
                      decoration: BoxDecoration(
                        color: Colors.blue.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.blue.withValues(alpha: 0.3), style: BorderStyle.solid),
                      ),
                      child: const Column(
                        children: [
                          Icon(Icons.camera_alt, size: 48, color: Colors.blue),
                          SizedBox(height: 16),
                          Text('Open Camera', style: TextStyle(color: Colors.blue, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  GestureDetector(
                    onTap: () => _pickImage(ImageSource.gallery),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 24),
                      decoration: BoxDecoration(
                        color: Colors.grey.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Column(
                        children: [
                          Icon(Icons.photo_library, size: 32, color: Colors.grey),
                          SizedBox(height: 8),
                          Text('Choose from Gallery', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ),
                ] else ...[
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Image.file(_image!, height: 300, width: double.infinity, fit: BoxFit.cover),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      TextButton.icon(
                        onPressed: () => setState(() { _image = null; _extractedTask = null; }),
                        icon: const Icon(Icons.refresh),
                        label: const Text('Retake'),
                      ),
                      if (_extractedTask == null)
                        PrimaryButton(
                          text: 'Analyze Image',
                          onPressed: _analyzeImage,
                        ),
                    ],
                  ),
                ],

                if (_extractedTask != null) ...[
                  const SizedBox(height: 32),
                  const Divider(),
                  const SizedBox(height: 16),
                  const Text('AI Extraction Results', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.blue.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.blue.withValues(alpha: 0.2)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildResultRow('Title', _extractedTask!.title),
                        _buildResultRow('Category', _extractedTask!.category),
                        _buildResultRow('Severity', _extractedTask!.severity.toString()),
                        _buildResultRow('Location', _extractedTask!.locationDescription),
                        _buildResultRow('Skills', _extractedTask!.requiredSkills.join(', ')),
                        const SizedBox(height: 8),
                        const Text('Raw Text:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey)),
                        const SizedBox(height: 4),
                        Text(_extractedTask!.rawReportText, style: const TextStyle(fontSize: 13)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  PrimaryButton(
                    text: 'Confirm & Save Task',
                    onPressed: _confirmAndSave,
                  ),
                  const SizedBox(height: 32),
                ]
              ],
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

  Widget _buildResultRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 80, child: Text(label, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue))),
          Expanded(child: Text(value.isEmpty ? 'N/A' : value)),
        ],
      ),
    );
  }
}
