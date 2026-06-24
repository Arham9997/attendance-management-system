const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getClassAttendance,
  getClassAttendanceByDate,
  getStudentAttendance,
  getStudentAttendanceBySubject,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/mark', authorize('teacher', 'admin'), markAttendance);
router.get('/class/:classId', authorize('teacher', 'admin'), getClassAttendance);
router.get('/class/:classId/date/:date', authorize('teacher', 'admin'), getClassAttendanceByDate);
router.get('/student/:studentId', getStudentAttendance); // self-check happens inside controller
router.get('/student/:studentId/by-subject', getStudentAttendanceBySubject);

module.exports = router;
