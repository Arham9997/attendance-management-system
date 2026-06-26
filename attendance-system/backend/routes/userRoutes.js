const express = require('express');
const router = express.Router();
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  resetPassword,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// Teacher and Admin can view users (used for roster)
router.get('/', protect, authorize('admin', 'teacher'), getUsers);

// Admin only
router.post('/', protect, authorize('admin'), createUser);
router.get('/:id', protect, authorize('admin'), getUserById);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);
router.put('/:id/reset-password', protect, authorize('admin'), resetPassword);

module.exports = router;
