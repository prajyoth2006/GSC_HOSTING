import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../../../core/widgets/custom_textfield.dart';
import '../../../core/widgets/primary_button.dart';
import '../../../core/widgets/loading_overlay.dart';

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _adminKeyController = TextEditingController();
  final _skillsController = TextEditingController();

  // App UI Roles: Admin, Field Worker, Volunteer
  String _selectedAppRole = 'Field Worker';

  // Backend Mapping
  String get _backendRole {
    switch (_selectedAppRole) {
      case 'Admin':
        return 'Admin';
      case 'Field Worker':
        return 'Worker';
      case 'Volunteer':
      default:
        return 'Volunteer';
    }
  }

  void _signup() async {
    if (_formKey.currentState!.validate()) {
      try {
        await ref.read(authStateProvider.notifier).register(
              name: _nameController.text.trim(),
              email: _emailController.text.trim(),
              password: _passwordController.text,
              role: _backendRole,
              adminKey: _selectedAppRole == 'Admin' ? _adminKeyController.text : null,
              skills: _selectedAppRole == 'Volunteer' && _skillsController.text.isNotEmpty
                  ? _skillsController.text.split(',').map((e) => e.trim()).toList()
                  : null,
            );
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Registration successful. Please login.')),
        );
        context.pop(); // Go back to login
      } catch (e) {
        // Error handled in the provider and thrown here
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Only looking at the global auth state for loading indicator
    final authState = ref.watch(authStateProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Account'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: Theme.of(context).colorScheme.onSurface),
      ),
      body: LoadingOverlay(
        isLoading: authState.isLoading,
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Card(
                elevation: 4,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                child: Padding(
                  padding: const EdgeInsets.all(32.0),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          'Join the Team',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 24),
                  CustomTextField(
                    label: 'Full Name',
                    hint: 'Enter your full name',
                    controller: _nameController,
                    prefixIcon: Icons.person_outline,
                    validator: (value) => value!.isEmpty ? 'Enter your name' : null,
                  ),
                  const SizedBox(height: 16),
                  CustomTextField(
                    label: 'Email',
                    hint: 'Enter your email',
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    prefixIcon: Icons.email_outlined,
                    validator: (value) => value!.isEmpty || !value.contains('@') ? 'Enter a valid email' : null,
                  ),
                  const SizedBox(height: 16),
                  CustomTextField(
                    label: 'Password',
                    hint: 'Enter your password',
                    controller: _passwordController,
                    isPassword: true,
                    prefixIcon: Icons.lock_outline,
                    validator: (value) => value!.length < 6 ? 'Password must be at least 6 characters' : null,
                  ),
                  const SizedBox(height: 16),
                  Text('Select Role',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: Theme.of(context).colorScheme.onSurface,
                          )),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: _selectedAppRole,
                    decoration: const InputDecoration(
                      prefixIcon: Icon(Icons.work_outline),
                    ),
                    items: ['Admin', 'Field Worker', 'Volunteer']
                        .map((role) => DropdownMenuItem(value: role, child: Text(role)))
                        .toList(),
                    onChanged: (val) {
                      setState(() {
                        _selectedAppRole = val!;
                      });
                    },
                  ),
                  if (_selectedAppRole == 'Admin') ...[
                    const SizedBox(height: 16),
                    CustomTextField(
                      label: 'Admin Passkey',
                      hint: 'Enter the admin registration key',
                      controller: _adminKeyController,
                      isPassword: true,
                      prefixIcon: Icons.key_outlined,
                      validator: (value) => _selectedAppRole == 'Admin' && value!.isEmpty ? 'Passkey is required for Admin' : null,
                    ),
                  ],
                  if (_selectedAppRole == 'Volunteer') ...[
                    const SizedBox(height: 16),
                    CustomTextField(
                      label: 'Skills (Optional)',
                      hint: 'e.g. Medical, Rescue, Transport',
                      controller: _skillsController,
                      prefixIcon: Icons.handyman_outlined,
                    ),
                  ],
                        const SizedBox(height: 32),
                        PrimaryButton(
                          text: 'Sign Up',
                          onPressed: _signup,
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text("Already have an account?"),
                            TextButton(
                              onPressed: () => context.pop(),
                              child: const Text('Log In'),
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
}
