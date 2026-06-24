const express = require('express');
const router = express.Router();
const {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  addStudents,
  deleteClass,
} = require('../controllers/classController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('teacher', 'admin'), createClass);
router.get('/', getClasses); // filtered by role inside controller
router.get('/:id', getClassById);
router.put('/:id', authorize('teacher', 'admin'), updateClass);
router.post('/:id/students', authorize('teacher', 'admin'), addStudents);
router.delete('/:id', authorize('teacher', 'admin'), deleteClass);

module.exports = router;
