const mongoose = require('mongoose');

/**
 * Represents a "class" created by a teacher — e.g. a section of students
 * taking a particular subject. Attendance is marked per ClassSession per date.
 */
const classSessionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Class name is required'], // e.g. "CSE-3A"
      trim: true,
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
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    schedule: {
      type: String, // free text e.g. "Mon/Wed/Fri 10:00-11:00"
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClassSession', classSessionSchema);
