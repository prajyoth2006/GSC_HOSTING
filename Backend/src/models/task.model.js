import mongoose, { Schema } from 'mongoose';

const taskSchema = new Schema({
  // 1. ADDED: Title (Crucial for the Admin Dashboard list view)
  title: {
    type: String,
    required: [true, 'A short title is required'],
    trim: true
  },
  rawReportText: {
    type: String,
    required: [true, 'Original report text is required']
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Medical', 'Rescue', 'Food & Water', 'Shelter', 
      'Sanitation', 'Labor', 'Transport', 'Supplies', 
      'Animal Rescue', 'Infrastructure', 'Other'
    ]
  },
  severity: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  requiredSkills: {
    type: [String],
    default: []
  },
  // 2. ADDED: Human-readable location (Crucial for Volunteers who don't just use GPS)
  locationDescription: {
    type: String,
    required: [true, 'A textual description of the location is required'],
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [Longitude, Latitude]
      required: true
    }
  },
  status: {
    type: String,
    enum: ['Pending', 'Matched', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  completionNote: {
    type: String,
    trim: true,
    default: ""
  },
  reportedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true 
  },
  assignedVolunteer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null 
  }
}, { 
  timestamps: true 
});

taskSchema.index({ location: '2dsphere' });

// This makes the dashboard sorting lightning fast
taskSchema.index({ status: 1, severity: -1, createdAt: -1 });

export const Task = mongoose.model('Task', taskSchema);