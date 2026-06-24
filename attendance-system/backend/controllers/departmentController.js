const Department = require('../models/Department');
const asyncHandler = require('../utils/asyncHandler');

const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, description, headOfDepartment } = req.body;
  const department = await Department.create({ name, code, description, headOfDepartment });
  res.status(201).json({ success: true, message: 'Department created', department });
});

const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find().populate('headOfDepartment', 'name email').sort({ name: 1 });
  res.json({ success: true, count: departments.length, departments });
});

const getDepartmentById = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id).populate('headOfDepartment', 'name email');
  if (!department) {
    return res.status(404).json({ success: false, message: 'Department not found' });
  }
  res.json({ success: true, department });
});

const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!department) {
    return res.status(404).json({ success: false, message: 'Department not found' });
  }
  res.json({ success: true, message: 'Department updated', department });
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) {
    return res.status(404).json({ success: false, message: 'Department not found' });
  }
  await department.deleteOne();
  res.json({ success: true, message: 'Department deleted' });
});

module.exports = { createDepartment, getDepartments, getDepartmentById, updateDepartment, deleteDepartment };
