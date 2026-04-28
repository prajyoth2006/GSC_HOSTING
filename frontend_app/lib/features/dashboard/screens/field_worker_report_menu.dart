import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';

class FieldWorkerReportMenu extends StatefulWidget {
  const FieldWorkerReportMenu({Key? key}) : super(key: key);

  @override
  State<FieldWorkerReportMenu> createState() => _FieldWorkerReportMenuState();
}

class _FieldWorkerReportMenuState extends State<FieldWorkerReportMenu> {
  String _locationStatus = "Fetching GPS Signal...";
  bool _isLocationReady = false;

  @override
  void initState() {
    super.initState();
    _initLocation();
  }

  Future<void> _initLocation() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() => _locationStatus = "Location services disabled.");
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.deniedForever || permission == LocationPermission.denied) {
        setState(() => _locationStatus = "Location permissions denied.");
        return;
      }

      final pos = await Geolocator.getCurrentPosition();
      if (mounted) {
        setState(() {
          _locationStatus = "Live: ${pos.latitude.toStringAsFixed(4)}, ${pos.longitude.toStringAsFixed(4)}";
          _isLocationReady = true;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _locationStatus = "Unable to fetch location.");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('Capture Incident', style: TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF0F172A), letterSpacing: -0.5)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Color(0xFF0F172A)),
      ),
      body: Stack(
        children: [
          // Sleek base layer
          Container(color: const Color(0xFFF1F5F9)),
          
          // Abstract Floating Gradients (Blobs) for the Mesh Gradient effect
          Positioned(top: -50, left: -50, child: Container(width: 300, height: 300, decoration: BoxDecoration(shape: BoxShape.circle, color: const Color(0xFF0F766E).withValues(alpha: 0.25)))),
          Positioned(top: 150, right: -100, child: Container(width: 250, height: 250, decoration: BoxDecoration(shape: BoxShape.circle, color: const Color(0xFF14B8A6).withValues(alpha: 0.2)))),
          Positioned(bottom: -50, left: 50, child: Container(width: 350, height: 350, decoration: BoxDecoration(shape: BoxShape.circle, color: const Color(0xFF34D399).withValues(alpha: 0.2)))),
          
          // Massive Blur Overlay to smooth the blobs
          Positioned.fill(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 80, sigmaY: 80),
              child: Container(color: Colors.white.withValues(alpha: 0.5)),
            ),
          ),
          
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // High-End Glass Telemetry Panel
                  ClipRRect(
                    borderRadius: BorderRadius.circular(24),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                      child: Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 20, offset: const Offset(0, 10)),
                            BoxShadow(color: Colors.white.withValues(alpha: 0.6), blurRadius: 10, spreadRadius: 1),
                          ],
                          border: Border.all(color: Colors.white.withValues(alpha: 0.8), width: 1.5),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: _isLocationReady ? Colors.teal.withValues(alpha: 0.15) : Colors.grey.withValues(alpha: 0.15),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(Icons.satellite_alt, color: _isLocationReady ? Colors.teal : Colors.grey.shade600, size: 28),
                            ),
                            const SizedBox(width: 20),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('GPS Telemetry', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Colors.grey.shade700, letterSpacing: 0.5)),
                                  const SizedBox(height: 4),
                                  Text(_locationStatus, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: _isLocationReady ? const Color(0xFF0F172A) : Colors.grey.shade700)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 48),
                  const Text('Select Reporting Mode', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 20, color: Color(0xFF0F172A), letterSpacing: -0.5)),
                  const SizedBox(height: 20),
                  
                  // Vertical Layout Strategy
                  _buildVerticalGlassCard(
                    context,
                    title: 'Scan Written Report',
                    subtitle: 'Upload a photo for AI to extract details instantly.',
                    icon: Icons.document_scanner_rounded,
                    onTap: () => context.push('/dashboard/upload-report'),
                    isPrimary: true,
                  ),
                  const SizedBox(height: 20),
                  _buildVerticalGlassCard(
                    context,
                    title: 'Manual Entry',
                    subtitle: 'Type out incident details and sync to the grid directly.',
                    icon: Icons.keyboard_alt_outlined,
                    onTap: () => context.push('/dashboard/report-issue'),
                    isPrimary: false,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVerticalGlassCard(BuildContext context, {required String title, required String subtitle, required IconData icon, required VoidCallback onTap, required bool isPrimary}) {
    final primary = Theme.of(context).colorScheme.primary;
    
    return GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: isPrimary ? primary.withValues(alpha: 0.85) : Colors.white.withValues(alpha: 0.6),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(color: (isPrimary ? primary : Colors.black).withValues(alpha: 0.15), blurRadius: 30, offset: const Offset(0, 15)),
                BoxShadow(color: Colors.white.withValues(alpha: 0.5), blurRadius: 5, spreadRadius: 1), // Inner glow
              ],
              border: Border.all(color: isPrimary ? primary.withValues(alpha: 0.5) : Colors.white.withValues(alpha: 0.8), width: 1.5),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isPrimary ? Colors.white.withValues(alpha: 0.2) : primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 5)),
                    ],
                  ),
                  child: Icon(icon, color: isPrimary ? Colors.white : primary, size: 36),
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: isPrimary ? Colors.white : const Color(0xFF0F172A), letterSpacing: 0.5)),
                      const SizedBox(height: 8),
                      Text(subtitle, style: TextStyle(color: isPrimary ? Colors.white.withValues(alpha: 0.9) : Colors.grey.shade700, fontSize: 13, height: 1.4)),
                    ],
                  ),
                ),
                Icon(Icons.arrow_forward_ios, color: isPrimary ? Colors.white.withValues(alpha: 0.6) : primary.withValues(alpha: 0.5), size: 18),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
