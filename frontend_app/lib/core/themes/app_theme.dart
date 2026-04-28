import 'package:flutter/material.dart';

class AppTheme {
  // Brand Colors - Premium Teal Theme
  static const Color primary = Color(0xFF0F766E); // Deep Teal
  static const Color secondary = Color(0xFF14B8A6); // Vivid Teal
  static const Color background = Color(0xFFF0FDFA); // Subtle Teal Tint Background
  static const Color surface = Colors.white;
  static const Color textPrimary = Color(0xFF0F172A); // Slate 900
  static const Color textSecondary = Color(0xFF64748B); // Slate 500
  static const Color error = Color(0xFFEF4444); // Red 500
  static const Color success = Color(0xFF10B981); // Emerald 500
  static const Color border = Color(0xFFCCFBF1); // Very light teal border

  static ThemeData get lightTheme {
    return ThemeData(
      primaryColor: primary,
      scaffoldBackgroundColor: background,
      colorScheme: const ColorScheme.light(
        primary: primary,
        secondary: secondary,
        surface: surface,
        error: error,
      ),
      fontFamily: 'Roboto', // Default fallback, but should ideally use Inter/Poppins
      textTheme: const TextTheme(
        displayLarge: TextStyle(color: textPrimary, fontSize: 32, fontWeight: FontWeight.bold),
        titleLarge: TextStyle(color: textPrimary, fontSize: 24, fontWeight: FontWeight.w600),
        bodyLarge: TextStyle(color: textPrimary, fontSize: 16, fontWeight: FontWeight.normal),
        bodyMedium: TextStyle(color: textSecondary, fontSize: 14, fontWeight: FontWeight.normal),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: error),
        ),
        labelStyle: const TextStyle(color: textSecondary),
        hintStyle: const TextStyle(color: textSecondary),
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 2,
        shadowColor: const Color(0x0D000000), // black with 0.05 opacity
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
    );
  }
}
