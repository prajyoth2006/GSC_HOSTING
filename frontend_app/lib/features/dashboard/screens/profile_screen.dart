import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/volunteer_provider.dart';
import '../../../core/themes/app_theme.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> with SingleTickerProviderStateMixin {
  bool _isLoading = false;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );

    _slideAnimation = Tween<Offset>(begin: const Offset(0, 0.1), end: Offset.zero).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOutCubic),
    );

    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _showEditProfileDialog(String currentName, String currentEmail) {
    final nameController = TextEditingController(text: currentName);
    final emailController = TextEditingController(text: currentEmail);
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.all(20),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.9),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: Colors.white.withOpacity(0.5)),
                ),
                padding: const EdgeInsets.all(24),
                child: Form(
                  key: formKey,
                  child: SingleChildScrollView(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.edit_note_rounded, size: 48, color: AppTheme.primary),
                        const SizedBox(height: 16),
                        const Text('Edit Profile', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 24),
                        _buildTextField(nameController, 'Full Name', Icons.person_outline, isObscure: false),
                        const SizedBox(height: 16),
                        _buildTextField(emailController, 'Email Address', Icons.email_outlined, isObscure: false),
                        const SizedBox(height: 32),
                        Row(
                          children: [
                            Expanded(
                              child: TextButton(
                                onPressed: () => Navigator.pop(context),
                                child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: ElevatedButton(
                                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                                onPressed: _isLoading ? null : () async {
                                  if (formKey.currentState?.validate() == true) {
                                    setDialogState(() => _isLoading = true);
                                    try {
                                      await ref.read(authStateProvider.notifier).updateAccount({
                                        'name': nameController.text.trim(),
                                        'email': emailController.text.trim(),
                                      });
                                      if (mounted) Navigator.pop(context);
                                    } catch (e) {
                                      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                                    } finally {
                                      if (mounted) setDialogState(() => _isLoading = false);
                                    }
                                  }
                                },
                                child: const Text('Save'),
                              ),
                            ),
                          ],
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
    );
  }

  void _showChangePasswordDialog() {
    final oldPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.all(20),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.9),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: Colors.white.withOpacity(0.5)),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 30, offset: const Offset(0, 10))
                  ],
                ),
                padding: const EdgeInsets.all(24),
                child: Form(
                  key: formKey,
                  child: SingleChildScrollView(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.lock_reset_rounded, size: 48, color: AppTheme.primary),
                        const SizedBox(height: 16),
                        const Text('Change Password', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                        const SizedBox(height: 24),
                        _buildTextField(oldPasswordController, 'Current Password', Icons.lock_outline),
                        const SizedBox(height: 16),
                        _buildTextField(newPasswordController, 'New Password', Icons.lock_outline),
                        const SizedBox(height: 16),
                        _buildTextField(confirmPasswordController, 'Confirm Password', Icons.verified_user_outlined),
                        const SizedBox(height: 32),
                        Row(
                          children: [
                            Expanded(
                              child: TextButton(
                                onPressed: () => Navigator.pop(context),
                                style: TextButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                ),
                                child: const Text('Cancel', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.primary,
                                  elevation: 0,
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                ),
                                onPressed: _isLoading ? null : () async {
                                  if (formKey.currentState?.validate() == true) {
                                    setDialogState(() => _isLoading = true);
                                    try {
                                      await ref.read(authStateProvider.notifier).updatePassword(
                                        oldPasswordController.text,
                                        newPasswordController.text,
                                      );
                                      if (mounted) {
                                        Navigator.pop(context);
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          const SnackBar(content: Text('Password updated successfully! Please log in again.'), backgroundColor: AppTheme.success),
                                        );
                                        context.go('/login');
                                      }
                                    } catch (e) {
                                      if (mounted) {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.error),
                                        );
                                      }
                                    } finally {
                                      if (mounted) setDialogState(() => _isLoading = false);
                                    }
                                  }
                                },
                                child: _isLoading 
                                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                  : const Text('Update', style: TextStyle(fontWeight: FontWeight.bold)),
                              ),
                            ),
                          ],
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
    );
  }

  Widget _buildTextField(TextEditingController controller, String label, IconData icon, {bool isObscure = true}) {
    return TextFormField(
      controller: controller,
      obscureText: isObscure,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: AppTheme.primary.withOpacity(0.7)),
        filled: true,
        fillColor: Colors.grey.shade100,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      ),
      validator: (val) {
        if (val == null || val.isEmpty) return 'Required';
        if (isObscure && label.contains('New') && val.length < 6) return 'Minimum 6 characters';
        return null;
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authStateProvider).value;
    if (user == null) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC), // Very light slate background
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () async {
                final canPop = await Navigator.maybePop(context);
                if (!canPop && mounted) context.go('/');
              },
            ),
          ),
        ),
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Column(
          children: [
            // HERO SECTION
            Stack(
              alignment: Alignment.bottomCenter,
              children: [
                Container(
                  height: 280,
                  width: double.infinity,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppTheme.primary, AppTheme.secondary],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.only(
                      bottomLeft: Radius.circular(40),
                      bottomRight: Radius.circular(40),
                    ),
                  ),
                  // Background dynamic pattern
                  child: ClipRRect(
                    borderRadius: const BorderRadius.only(
                      bottomLeft: Radius.circular(40),
                      bottomRight: Radius.circular(40),
                    ),
                    child: Stack(
                      children: [
                        Positioned(
                          top: -50,
                          right: -50,
                          child: Container(
                            width: 200,
                            height: 200,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white.withOpacity(0.1),
                            ),
                          ),
                        ),
                        Positioned(
                          bottom: -100,
                          left: -50,
                          child: Container(
                            width: 250,
                            height: 250,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white.withOpacity(0.05),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                
                // Profile Avatar & Info
                FadeTransition(
                  opacity: _fadeAnimation,
                  child: SlideTransition(
                    position: _slideAnimation,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            shape: BoxShape.circle,
                          ),
                          child: CircleAvatar(
                            radius: 50,
                            backgroundColor: Colors.white,
                            child: Text(
                              user.name.isNotEmpty ? user.name[0].toUpperCase() : 'U',
                              style: const TextStyle(fontSize: 40, fontWeight: FontWeight.bold, color: AppTheme.primary),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          user.name,
                          style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: -0.5),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            user.role.toUpperCase(),
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: 1.5),
                          ),
                        ),
                        const SizedBox(height: 30),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            
            // DETAILS SECTION
            FadeTransition(
              opacity: _fadeAnimation,
              child: SlideTransition(
                position: _slideAnimation,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Profile Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                      const SizedBox(height: 16),
                      // Glass/Modern Card for Details
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 20, offset: const Offset(0, 10)),
                          ],
                        ),
                        child: Column(
                          children: [
                            _buildModernInfoTile(Icons.email_outlined, 'Email Address', user.email),
                            _buildDivider(),
                            _buildModernInfoTile(Icons.badge_outlined, 'User ID', user.id),
                            if (user.role == 'Volunteer') ...[
                              _buildDivider(),
                              _buildModernInfoTile(Icons.category_outlined, 'Assigned Category', user.category ?? 'Unassigned'),
                              if (user.skills != null && user.skills!.isNotEmpty) ...[
                                _buildDivider(),
                                _buildModernInfoTile(Icons.psychology_outlined, 'Skills', user.skills!.join(', ')),
                              ]
                            ]
                          ],
                        ),
                      ),
                      
                      const SizedBox(height: 32),
                      const Text('Account Settings', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                      const SizedBox(height: 16),
                      
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 20, offset: const Offset(0, 10)),
                          ],
                        ),
                        child: Column(
                          children: [
                            _buildModernActionTile(
                              icon: Icons.person_outline_rounded,
                              title: 'Edit Profile Info',
                              onTap: () => _showEditProfileDialog(user.name, user.email),
                            ),
                            _buildDivider(),
                            _buildModernActionTile(
                              icon: Icons.lock_outline_rounded,
                              title: 'Change Password',
                              onTap: _showChangePasswordDialog,
                            ),
                            _buildDivider(),
                            _buildModernActionTile(
                              icon: Icons.logout_rounded,
                              title: 'Sign Out',
                              isDestructive: true,
                              onTap: () {
                                ref.read(authStateProvider.notifier).logout();
                                context.go('/login');
                              },
                            ),
                          ],
                        ),
                      ),
                      
                      if (user.role == 'Volunteer') ...[
                        const SizedBox(height: 32),
                        const Text('Mission History', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                        const SizedBox(height: 16),
                        _buildHistorySection(ref),
                      ],
                      const SizedBox(height: 48),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHistorySection(WidgetRef ref) {
    final historyAsync = ref.watch(volunteerHistoryProvider);
    
    return historyAsync.when(
      data: (tasks) {
        if (tasks.isEmpty) {
          return Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24)),
            child: const Center(child: Text('No completed missions yet.', style: TextStyle(color: Colors.grey))),
          );
        }
        return ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: tasks.length,
          separatorBuilder: (context, index) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final task = tasks[index];
            return Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10)],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: AppTheme.success.withOpacity(0.1), shape: BoxShape.circle),
                    child: const Icon(Icons.check_circle_outline, color: AppTheme.success, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(task.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        Text(task.category, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                      ],
                    ),
                  ),
                  Text(
                    'Completed',
                    style: TextStyle(color: AppTheme.success.withOpacity(0.8), fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            );
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, st) => Text('Error loading history: $e'),
    );
  }

  Widget _buildDivider() {
    return Divider(height: 1, thickness: 1, color: Colors.grey.shade100, indent: 70);
  }

  Widget _buildModernInfoTile(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.primary.withOpacity(0.05),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: AppTheme.primary, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildModernActionTile({required IconData icon, required String title, required VoidCallback onTap, bool isDestructive = false}) {
    final color = isDestructive ? AppTheme.error : AppTheme.textPrimary;
    final iconBgColor = isDestructive ? AppTheme.error.withOpacity(0.1) : AppTheme.primary.withOpacity(0.05);
    final iconColor = isDestructive ? AppTheme.error : AppTheme.primary;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: iconBgColor,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(icon, color: iconColor, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(title, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color)),
              ),
              Icon(Icons.chevron_right_rounded, color: Colors.grey.shade400),
            ],
          ),
        ),
      ),
    );
  }
}
