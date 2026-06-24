const express = require('express');
const router = express.Router();
const { adminDashboard, teacherDashboard } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

router.get('/admin', protect, authorize('admin'), adminDashboard);
router.get('/teacher', protect, authorize('teacher'), teacherDashboard);

module.exports = router;
