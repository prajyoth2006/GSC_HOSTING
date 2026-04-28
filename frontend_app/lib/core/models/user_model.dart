class UserModel {
  final String id;
  final String name;
  final String email;
  final String role;
  final String? category;
  final List<String>? skills;
  final bool? isAvailable;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.category,
    this.skills,
    this.isAvailable,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? '',
      category: json['category'],
      skills: json['skills'] != null ? List<String>.from(json['skills']) : null,
      isAvailable: json['isAvailable'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'email': email,
      'role': role,
      'category': category,
      'skills': skills,
      'isAvailable': isAvailable,
    };
  }
}
