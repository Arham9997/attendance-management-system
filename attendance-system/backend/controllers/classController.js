const ClassSession = require('../models/ClassSession');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route   POST /api/classes
 * @desc    Teacher (or admin) creates a class/section for a subject
 * @access  Private/Teacher,Admin
 */
const createClass = asyncHandler(async (req, res) => {
  const { name, subject, department, students, schedule } = req.body;

  // Teachers always create classes under themselves; admins may specify a teacher
  const teacher = req.user.role === 'admin' && req.body.teacher ? req.body.teacher : req.user._id;

  const classSession = await ClassSession.create({
    name,
    subject,
    department,
    teacher,
    students: students || [],
    schedule,
  });

  res.status(201).json({ success: true, message: 'Class created successfully', classSession });
});

/**
 * @route   GET /api/classes
 * @desc    List classes. Teachers see their own; admins see all; query filters supported.
 * @access  Private
 */
const getClasses = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === 'teacher') {
    filter.teacher = req.user._id;
  } else if (req.user.role === 'student') {
    filter.students = req.user._id;
  }

  if (req.query.subject) filter.subject = req.query.subject;
  if (req.query.department) filter.department = req.query.department;

  const classes = await ClassSession.find(filter)
    .populate('subject', 'name code')
    .populate('teacher', 'name email')
    .populate('department', 'name code')
    .populate('students', 'name email rollNumber')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: classes.length, classes });
});

/**
 * @route   GET /api/classes/:id
 * @desc    Get single class with full student roster
 * @access  Private
 */
const getClassById = asyncHandler(async (req, res) => {
  const classSession = await ClassSession.findById(req.params.id)
    .populate('subject', 'name code')
    .populate('teacher', 'name email')
    .populate('department', 'name code')
    .populate('students', 'name email rollNumber');

  if (!classSession) {
    return res.status(404).json({ success: false, message: 'Class not found' });
  }

  res.json({ success: true, classSession });
});

/**
 * @route   PUT /api/classes/:id
 * @desc    Update class details (name, schedule, roster)
 * @access  Private/Teacher(owner),Admin
 */
const updateClass = asyncHandler(async (req, res) => {
  const classSession = await ClassSession.findById(req.params.id);
  if (!classSession) {
    return res.status(404).json({ success: false, message: 'Class not found' });
  }

  if (req.user.role === 'teacher' && String(classSession.teacher) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'You do not own this class' });
  }

  const { name, students, schedule, isActive } = req.body;
  if (name !== undefined) classSession.name = name;
  if (students !== undefined) classSession.students = students;
  if (schedule !== undefined) classSession.schedule = schedule;
  if (isActive !== undefined) classSession.isActive = isActive;

  await classSession.save();
  res.json({ success: true, message: 'Class updated successfully', classSession });
});

/**
 * @route   POST /api/classes/:id/students
 * @desc    Add one or more students to a class roster
 * @access  Private/Teacher(owner),Admin
 */
const addStudents = asyncHandler(async (req, res) => {
  const { studentIds } = req.body; // array of user IDs
  const classSession = await ClassSession.findById(req.params.id);
  if (!classSession) {
    return res.status(404).json({ success: false, message: 'Class not found' });
  }

  if (req.user.role === 'teacher' && String(classSession.teacher) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'You do not own this class' });
  }

  const validStudents = await User.find({ _id: { $in: studentIds }, role: 'student' }).select('_id');
  const validIds = validStudents.map((s) => String(s._id));

  const existingIds = new Set(classSession.students.map(String));
  validIds.forEach((id) => {
    if (!existingIds.has(id)) classSession.students.push(id);
  });

  await classSession.save();
  res.json({ success: true, message: 'Students added', classSession });
});

/**
 * @route   DELETE /api/classes/:id
 * @desc    Delete a class
 * @access  Private/Teacher(owner),Admin
 */
const deleteClass = asyncHandler(async (req, res) => {
  const classSession = await ClassSession.findById(req.params.id);
  if (!classSession) {
    return res.status(404).json({ success: false, message: 'Class not found' });
  }

  if (req.user.role === 'teacher' && String(classSession.teacher) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'You do not own this class' });
  }

  await classSession.deleteOne();
  res.json({ success: true, message: 'Class deleted successfully' });
});

module.exports = { createClass, getClasses, getClassById, updateClass, addStudents, deleteClass };
