const User = require('../models/User');
const Department = require('../models/Department');
const Subject = require('../models/Subject');
const ClassSession = require('../models/ClassSession');
const Attendance = require('../models/Attendance');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route   GET /api/dashboard/admin
 * @desc    High-level counts for the admin dashboard
 * @access  Private/Admin
 */
const adminDashboard = asyncHandler(async (req, res) => {
  const [totalStudents, totalTeachers, totalDepartments, totalSubjects, totalClasses, totalAttendanceDocs] =
    await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      Department.countDocuments(),
      Subject.countDocuments(),
      ClassSession.countDocuments(),
      Attendance.countDocuments(),
    ]);

  res.json({
    success: true,
    stats: { totalStudents, totalTeachers, totalDepartments, totalSubjects, totalClasses, totalAttendanceDocs },
  });
});

/**
 * @route   GET /api/dashboard/teacher
 * @desc    Summary for a teacher: their classes and today's marking status
 * @access  Private/Teacher
 */
const teacherDashboard = asyncHandler(async (req, res) => {
  const classes = await ClassSession.find({ teacher: req.user._id })
    .populate('subject', 'name code')
    .populate('students', '_id');

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const todaysAttendance = await Attendance.find({
    teacher: req.user._id,
    date: today,
  }).select('classSession');

  const markedClassIds = new Set(todaysAttendance.map((a) => String(a.classSession)));

  const classSummaries = classes.map((c) => ({
    _id: c._id,
    name: c.name,
    subject: c.subject,
    studentCount: c.students.length,
    markedToday: markedClassIds.has(String(c._id)),
  }));

  res.json({
    success: true,
    totalClasses: classes.length,
    classes: classSummaries,
  });
});

module.exports = { adminDashboard, teacherDashboard };
