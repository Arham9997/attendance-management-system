const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route   POST /api/users
 * @desc    Admin creates a user (admin, teacher, or student)
 * @access  Private/Admin
 */
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, rollNumber, department, subjects, phone } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    rollNumber,
    department,
    subjects,
    phone,
  });

  res.status(201).json({ success: true, message: 'User created successfully', user });
});

/**
 * @route   GET /api/users
 * @desc    List all users, with optional filters (role, department)
 * @access  Private/Admin
 */
const getUsers = asyncHandler(async (req, res) => {
  const { role, department, search } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (department) filter.department = department;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { rollNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(filter)
    .populate('department', 'name code')
    .populate('subjects', 'name code')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: users.length, users });
});

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID
 * @access  Private/Admin
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('department', 'name code')
    .populate('subjects', 'name code');

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, user });
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update a user's profile/role/department/subjects
 * @access  Private/Admin
 */
const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, rollNumber, department, subjects, phone, isActive } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (role !== undefined) user.role = role;
  if (rollNumber !== undefined) user.rollNumber = rollNumber;
  if (department !== undefined) user.department = department;
  if (subjects !== undefined) user.subjects = subjects;
  if (phone !== undefined) user.phone = phone;
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();

  res.json({ success: true, message: 'User updated successfully', user });
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  await user.deleteOne();
  res.json({ success: true, message: 'User deleted successfully' });
});

/**
 * @route   PUT /api/users/:id/reset-password
 * @desc    Admin resets a user's password
 * @access  Private/Admin
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password reset successfully' });
});

module.exports = { createUser, getUsers, getUserById, updateUser, deleteUser, resetPassword };
