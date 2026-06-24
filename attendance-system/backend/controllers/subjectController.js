const Subject = require('../models/Subject');
const asyncHandler = require('../utils/asyncHandler');

const createSubject = asyncHandler(async (req, res) => {
  const { name, code, department, semester, teacher, credits } = req.body;
  const subject = await Subject.create({ name, code, department, semester, teacher, credits });
  res.status(201).json({ success: true, message: 'Subject created', subject });
});

const getSubjects = asyncHandler(async (req, res) => {
  const { department, teacher } = req.query;
  const filter = {};
  if (department) filter.department = department;
  if (teacher) filter.teacher = teacher;

  const subjects = await Subject.find(filter)
    .populate('department', 'name code')
    .populate('teacher', 'name email')
    .sort({ name: 1 });

  res.json({ success: true, count: subjects.length, subjects });
});

const getSubjectById = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id)
    .populate('department', 'name code')
    .populate('teacher', 'name email');
  if (!subject) {
    return res.status(404).json({ success: false, message: 'Subject not found' });
  }
  res.json({ success: true, subject });
});

const updateSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!subject) {
    return res.status(404).json({ success: false, message: 'Subject not found' });
  }
  res.json({ success: true, message: 'Subject updated', subject });
});

const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) {
    return res.status(404).json({ success: false, message: 'Subject not found' });
  }
  await subject.deleteOne();
  res.json({ success: true, message: 'Subject deleted' });
});

module.exports = { createSubject, getSubjects, getSubjectById, updateSubject, deleteSubject };
