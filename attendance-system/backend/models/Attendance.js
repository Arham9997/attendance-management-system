const mongoose = require('mongoose');

/**
 * One document per class session per date.
 * `records` holds the per-student status for that date, avoiding
 * one document per student per day (keeps writes/reads efficient).
 */
const attendanceRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true,
      default: 'absent',
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    classSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClassSession',
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    records: [attendanceRecordSchema],
  },
  { timestamps: true }
);

// Prevent duplicate attendance entries for the same class on the same day
attendanceSchema.index({ classSession: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
