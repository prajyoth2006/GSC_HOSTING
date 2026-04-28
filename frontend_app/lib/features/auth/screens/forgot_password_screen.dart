import 'package:flutter/material.dart';
import '../../../core/widgets/custom_textfield.dart';
import '../../../core/widgets/primary_button.dart';
import 'package:go_router/go_router.dart';

class ForgotPasswordScreen extends StatelessWidget {
  const ForgotPasswordScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Placeholder screen for Forgot Password as backend doesn't support unauthenticated reset yet
    final emailController = TextEditingController();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Reset Password'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: Theme.of(context).colorScheme.onSurface),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Enter your email address and we will send you a link to reset your password.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 24),
              CustomTextField(
                label: 'Email',
                hint: 'Enter your email',
                controller: emailController,
                prefixIcon: Icons.email_outlined,
              ),
              const SizedBox(height: 32),
              PrimaryButton(
                text: 'Send Reset Link',
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Password reset functionality is under development.')),
                  );
                  context.pop();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
