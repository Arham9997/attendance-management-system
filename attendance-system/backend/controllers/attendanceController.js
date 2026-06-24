const Attendance = require('../models/Attendance');
const ClassSession = require('../models/ClassSession');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { computeStudentAttendance } = require('../utils/attendanceCalculator');
const { checkAndNotifyLowAttendance } = require('../utils/lowAttendanceNotifier');

/**
 * @route   POST /api/attendance/mark
 * @desc    Teacher marks/updates attendance for a class on a given date.
 *          Upserts: if attendance for this class+date already exists, it's overwritten.
 * @access  Private/Teacher,Admin
 * @body    { classSessionId, date, records: [{ student, status, remarks }] }
 */
const markAttendance = asyncHandler(async (req, res) => {
  const { classSessionId, date, records } = req.body;

  if (!classSessionId || !date || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'classSessionId, date, and a non-empty records array are required',
    });
  }

  const classSession = await ClassSession.findById(classSessionId);
  if (!classSession) {
    return res.status(404).json({ success: false, message: 'Class not found' });
  }

  if (req.user.role === 'teacher' && String(classSession.teacher) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'You do not own this class' });
  }

  // Normalize date to midnight UTC so repeated marking on the same calendar day upserts correctly
  const normalizedDate = new Date(date);
  normalizedDate.setUTCHours(0, 0, 0, 0);

  const attendance = await Attendance.findOneAndUpdate(
    { classSession: classSessionId, date: normalizedDate },
    {
      classSession: classSessionId,
      subject: classSession.subject,
      teacher: classSession.teacher,
      date: normalizedDate,
      records,
    },
    { upsert: true, new: true, runValidators: true }
  );

  res.status(200).json({ success: true, message: 'Attendance marked successfully', attendance });

  // Fire-and-forget: check each absent/late student's running percentage and email if low.
  // Done after responding so the teacher isn't kept waiting on email delivery.
  checkAndNotifyLowAttendance(records.map((r) => r.student)).catch((err) =>
    console.error('Low attendance notification check failed:', err.message)
  );
});

/**
 * @route   GET /api/attendance/class/:classId
 * @desc    Get attendance history for a class, optionally filtered by date range
 * @access  Private/Teacher,Admin
 */
const getClassAttendance = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const filter = { classSession: req.params.classId };
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const attendance = await Attendance.find(filter)
    .populate('records.student', 'name rollNumber email')
    .populate('subject', 'name code')
    .sort({ date: -1 });

  res.json({ success: true, count: attendance.length, attendance });
});

/**
 * @route   GET /api/attendance/class/:classId/date/:date
 * @desc    Get attendance for a specific class on a specific date (for editing)
 * @access  Private/Teacher,Admin
 */
const getClassAttendanceByDate = asyncHandler(async (req, res) => {
  const normalizedDate = new Date(req.params.date);
  normalizedDate.setUTCHours(0, 0, 0, 0);

  const attendance = await Attendance.findOne({
    classSession: req.params.classId,
    date: normalizedDate,
  }).populate('records.student', 'name rollNumber email');

  if (!attendance) {
    // Not an error — simply hasn't been marked yet. Return the roster so the UI can render a fresh form.
    const classSession = await ClassSession.findById(req.params.classId).populate(
      'students',
      'name rollNumber email'
    );
    return res.json({
      success: true,
      attendance: null,
      roster: classSession ? classSession.students : [],
    });
  }

  res.json({ success: true, attendance });
});

/**
 * @route   GET /api/attendance/student/:studentId
 * @desc    Get a student's attendance summary + history (optionally scoped to a subject)
 * @access  Private (self, or teacher/admin)
 */
const getStudentAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { subjectId, from, to } = req.query;

  // Students may only view their own records
  if (req.user.role === 'student' && String(req.user._id) !== String(studentId)) {
    return res.status(403).json({ success: false, message: 'You can only view your own attendance' });
  }

  const result = await computeStudentAttendance(studentId, { subjectId, from, to });
  res.json({ success: true, ...result });
});

/**
 * @route   GET /api/attendance/student/:studentId/by-subject
 * @desc    Get a student's attendance percentage broken down per enrolled subject
 * @access  Private (self, or teacher/admin)
 */
const getStudentAttendanceBySubject = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  if (req.user.role === 'student' && String(req.user._id) !== String(studentId)) {
    return res.status(403).json({ success: false, message: 'You can only view your own attendance' });
  }

  const student = await User.findById(studentId).populate('subjects', 'name code');
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  const breakdown = [];
  for (const subject of student.subjects) {
    const stats = await computeStudentAttendance(studentId, { subjectId: subject._id });
    breakdown.push({
      subject: { _id: subject._id, name: subject.name, code: subject.code },
      totalClasses: stats.totalClasses,
      present: stats.present,
      absent: stats.absent,
      late: stats.late,
      excused: stats.excused,
      percentage: stats.percentage,
    });
  }

  res.json({ success: true, breakdown });
});

module.exports = {
  markAttendance,
  getClassAttendance,
  getClassAttendanceByDate,
  getStudentAttendance,
  getStudentAttendanceBySubject,
};
