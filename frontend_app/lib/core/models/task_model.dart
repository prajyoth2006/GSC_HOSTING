class TaskModel {
  final String? id;
  final String title;
  final String category;
  final String rawReportText;
  final int severity;
  final List<String> requiredSkills;
  final String locationDescription;
  final String status;
  final String? completionNote;
  final List<double>? locationCoordinates; // [lng, lat]

  TaskModel({
    this.id,
    required this.title,
    required this.category,
    required this.rawReportText,
    required this.severity,
    required this.requiredSkills,
    required this.locationDescription,
    this.status = 'Pending',
    this.completionNote,
    this.locationCoordinates,
  });

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    return TaskModel(
      id: json['_id'],
      title: json['title'] ?? '',
      category: json['category'] ?? 'Other',
      rawReportText: json['rawReportText'] ?? '',
      severity: int.tryParse(json['severity']?.toString() ?? '') ?? 3,
      requiredSkills: json['requiredSkills'] != null ? List<String>.from(json['requiredSkills']) : [],
      locationDescription: json['locationDescription'] ?? '',
      status: json['status'] ?? 'Pending',
      completionNote: json['completionNote'],
      locationCoordinates: json['location'] != null && json['location']['coordinates'] != null
          ? List<double>.from((json['location']['coordinates'] as List).map((e) => (e as num).toDouble()))
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'category': category,
      'rawReportText': rawReportText,
      'severity': severity,
      'requiredSkills': requiredSkills,
      'locationDescription': locationDescription,
      'status': status,
      if (completionNote != null) 'completionNote': completionNote,
      if (locationCoordinates != null) 'location': {
        'type': 'Point',
        'coordinates': locationCoordinates,
      }
    };
  }
}
