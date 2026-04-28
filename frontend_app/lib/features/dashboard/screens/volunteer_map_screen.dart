import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:dio/dio.dart';
import 'package:geolocator/geolocator.dart';
import '../providers/volunteer_provider.dart';
import '../../../core/themes/app_theme.dart';
import 'volunteer_task_modal.dart';
import '../../../core/models/task_model.dart';
import 'dart:ui';
import 'dart:async';
import '../widgets/volunteer_drawer.dart';
import '../../auth/providers/auth_provider.dart';

class VolunteerMapScreen extends ConsumerStatefulWidget {
  const VolunteerMapScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<VolunteerMapScreen> createState() => _VolunteerMapScreenState();
}

class _VolunteerMapScreenState extends ConsumerState<VolunteerMapScreen> {
  final MapController _mapController = MapController();
  final TextEditingController _searchController = TextEditingController();
  
  bool _isSearching = false;
  List<dynamic> _suggestions = [];
  Timer? _debounce;
  Timer? _locationTimer;
  double _currentZoom = 13.0;

  // Map Layer URLs
  static const String layerOSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  static const String layerSatellite = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  static const String layerDark = 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
  static const String layerLight = 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';

  String _currentLayerUrl = layerOSM;

  @override
  void dispose() {
    _searchController.dispose();
    _mapController.dispose();
    _debounce?.cancel();
    _locationTimer?.cancel();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    _startLocationUpdates();
  }

  void _startLocationUpdates() {
    _locationTimer?.cancel();
    _locationTimer = Timer.periodic(const Duration(seconds: 30), (timer) async {
      final user = ref.read(authStateProvider).value;
      if (user != null && user.isAvailable == true) {
        try {
          Position position = await Geolocator.getCurrentPosition(
            desiredAccuracy: LocationAccuracy.high,
          );
          await ref.read(volunteerProvider.notifier).updateLocation(
            position.latitude,
            position.longitude,
          );
        } catch (e) {
          debugPrint('Live location update failed: $e');
        }
      }
    });
  }

  void _onSearchChanged(String value) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      if (value.isNotEmpty && value.length > 2) {
        _fetchSuggestions(value);
      } else {
        setState(() { _suggestions = []; });
      }
    });
  }

  Future<void> _fetchSuggestions(String query) async {
    try {
      final dio = Dio(BaseOptions(
        connectTimeout: const Duration(seconds: 5),
        receiveTimeout: const Duration(seconds: 5),
        headers: {
          'User-Agent': 'CommunityResponseApp/1.0 (com.solutionchallenge.frontend_app)',
        },
      ));

      final response = await dio.get(
        'https://nominatim.openstreetmap.org/search',
        queryParameters: {
          'q': query,
          'format': 'json',
          'addressdetails': 1,
          'limit': 5,
        },
      );

      if (mounted) {
        setState(() {
          _suggestions = response.data is List ? response.data : [];
        });
      }
    } catch (e) {
      debugPrint('Suggestion error: $e');
    }
  }

  void _selectSuggestion(dynamic suggestion) {
    final lat = double.parse(suggestion['lat']);
    final lon = double.parse(suggestion['lon']);
    final displayName = suggestion['display_name'];

    setState(() {
      _searchController.text = displayName;
      _suggestions = [];
    });

    _mapController.move(LatLng(lat, lon), 15.0);
    _currentZoom = 15.0;
    FocusScope.of(context).unfocus();
  }

  Future<void> _searchLocation(String query) async {
    if (query.trim().isEmpty) return;

    setState(() { _isSearching = true; });

    try {
      final dio = Dio(BaseOptions(
        connectTimeout: const Duration(seconds: 5),
        receiveTimeout: const Duration(seconds: 5),
        headers: {
          'User-Agent': 'CommunityResponseApp/1.0 (com.solutionchallenge.frontend_app)',
        },
      ));

      final response = await dio.get(
        'https://nominatim.openstreetmap.org/search',
        queryParameters: {
          'q': query,
          'format': 'json',
          'addressdetails': 1,
          'limit': 1,
        },
      );

      final data = response.data;
      if (data is List && data.isNotEmpty) {
        final lat = double.parse(data[0]['lat']);
        final lon = double.parse(data[0]['lon']);
        _mapController.move(LatLng(lat, lon), 14.0);
        _currentZoom = 14.0;
        FocusScope.of(context).unfocus(); // Close keyboard
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Location not found')));
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Search failed: $e')));
    } finally {
      if (mounted) setState(() { _isSearching = false; });
    }
  }

  Future<void> _moveToCurrentLocation() async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Location permissions are denied')));
          return;
        }
      }

      Position position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
      _mapController.move(LatLng(position.latitude, position.longitude), 15.0);
      _currentZoom = 15.0;

      // UPDATE BACKEND LOCATION (so Admin can assign matching tasks nearby)
      final user = ref.read(authStateProvider).value;
      if (user != null && user.isAvailable == true) {
        // Hitting toggleAvailability with 'true' simply updates their current GPS coordinates securely in the backend
        await ref.read(volunteerProvider.notifier).toggleAvailability(true);
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to get location')));
    }
  }

  void _zoomIn() {
    _currentZoom = (_currentZoom + 1).clamp(2.0, 18.0);
    _mapController.move(_mapController.camera.center, _currentZoom);
  }

  void _zoomOut() {
    _currentZoom = (_currentZoom - 1).clamp(2.0, 18.0);
    _mapController.move(_mapController.camera.center, _currentZoom);
  }

  @override
  Widget build(BuildContext context) {
    final tasksAsync = ref.watch(volunteerTasksProvider);

    return Scaffold(
      extendBodyBehindAppBar: true,
      body: Stack(
        children: [
          tasksAsync.when(
            data: (tasks) {
              LatLng initialCenter = const LatLng(0, 0);
              if (tasks.isNotEmpty) {
                for (var task in tasks) {
                  if (task.locationCoordinates != null && task.locationCoordinates!.length >= 2) {
                    initialCenter = LatLng(task.locationCoordinates![1], task.locationCoordinates![0]);
                    break;
                  }
                }
              }

              return FlutterMap(
                mapController: _mapController,
                options: MapOptions(
                  initialCenter: initialCenter,
                  initialZoom: _currentZoom,
                  onPositionChanged: (pos, hasGesture) {
                    if (pos.zoom != null) {
                      _currentZoom = pos.zoom!;
                    }
                  },
                ),
                children: [
                  TileLayer(
                    urlTemplate: _currentLayerUrl,
                    userAgentPackageName: 'com.solutionchallenge.frontend_app',
                  ),
                  MarkerLayer(
                    markers: tasks.where((t) => t.locationCoordinates != null && t.locationCoordinates!.length >= 2).map((task) {
                      return Marker(
                        point: LatLng(task.locationCoordinates![1], task.locationCoordinates![0]),
                        width: 50,
                        height: 50,
                        child: GestureDetector(
                          onTap: () {
                            _showTaskModal(context, task);
                          },
                          child: Container(
                            decoration: BoxDecoration(
                              color: _getSeverityColor(task.severity),
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.3),
                                  blurRadius: 8,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: const Icon(Icons.assignment_late, color: Colors.white, size: 24),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, stack) => Center(child: Text('Error: $error')),
          ),

          // Search Bar & Map Layer at Top Left and Top Right
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              child: Row(
                children: [
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _buildGlassContainer(
                          child: TextField(
                            controller: _searchController,
                            onSubmitted: _searchLocation,
                            onChanged: _onSearchChanged,
                            decoration: InputDecoration(
                              hintText: 'Search location...',
                              hintStyle: const TextStyle(color: Colors.black54),
                              border: InputBorder.none,
                              prefixIcon: const Icon(Icons.search, color: AppTheme.primary),
                              suffixIcon: _isSearching
                                  ? const Padding(
                                      padding: EdgeInsets.all(12.0),
                                      child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                                    )
                                  : IconButton(
                                      icon: const Icon(Icons.arrow_forward_rounded, color: AppTheme.primary),
                                      onPressed: () => _searchLocation(_searchController.text),
                                    ),
                              contentPadding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                          ),
                        ),
                        if (_suggestions.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 8.0),
                            child: _buildGlassContainer(
                              child: ConstrainedBox(
                                constraints: const BoxConstraints(maxHeight: 250),
                                child: ListView.separated(
                                  shrinkWrap: true,
                                  physics: const BouncingScrollPhysics(),
                                  padding: EdgeInsets.zero,
                                  itemCount: _suggestions.length,
                                  separatorBuilder: (context, index) => const Divider(height: 1, color: Colors.black12),
                                  itemBuilder: (context, index) {
                                    final s = _suggestions[index];
                                    return ListTile(
                                      leading: const Icon(Icons.location_on_outlined, color: AppTheme.primary, size: 20),
                                      title: Text(
                                        s['display_name'] ?? 'Unknown location',
                                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      onTap: () => _selectSuggestion(s),
                                    );
                                  },
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  _buildGlassContainer(
                    child: PopupMenuButton<String>(
                      icon: const Icon(Icons.layers, color: AppTheme.primary),
                      onSelected: (String result) {
                        setState(() { _currentLayerUrl = result; });
                      },
                      itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
                        const PopupMenuItem<String>(value: layerOSM, child: Text('Standard')),
                        const PopupMenuItem<String>(value: layerSatellite, child: Text('Satellite')),
                        const PopupMenuItem<String>(value: layerLight, child: Text('Light Mode')),
                        const PopupMenuItem<String>(value: layerDark, child: Text('Dark Mode')),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Zoom Controls and GPS Button at Bottom Right
          Positioned(
            bottom: 30, // Above bottom navigation bar
            right: 16,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildFloatingButton(
                  icon: Icons.gps_fixed,
                  onPressed: _moveToCurrentLocation,
                ),
                const SizedBox(height: 16),
                _buildGlassContainer(
                  child: Column(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.add, color: AppTheme.primary),
                        onPressed: _zoomIn,
                      ),
                      Container(height: 1, width: 30, color: Colors.black12),
                      IconButton(
                        icon: const Icon(Icons.remove, color: AppTheme.primary),
                        onPressed: _zoomOut,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Refresh Tasks Bottom Left
          Positioned(
            bottom: 30,
            left: 16,
            child: _buildFloatingButton(
              icon: Icons.refresh,
              onPressed: () => ref.invalidate(volunteerTasksProvider),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGlassContainer({required Widget child}) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.8),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withValues(alpha: 0.5), width: 1.5),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: child,
        ),
      ),
    );
  }

  Widget _buildFloatingButton({required IconData icon, required VoidCallback onPressed}) {
    return _buildGlassContainer(
      child: IconButton(
        icon: Icon(icon, color: AppTheme.primary),
        onPressed: onPressed,
      ),
    );
  }

  void _showTaskModal(BuildContext context, TaskModel task) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => VolunteerTaskModal(task: task),
    );
  }

  Color _getSeverityColor(int severity) {
    if (severity >= 4) return AppTheme.error;
    if (severity == 3) return Colors.orange;
    return AppTheme.primary;
  }
}
