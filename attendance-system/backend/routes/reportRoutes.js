const express = require('express');
const router = express.Router();
const { studentReportPDF, studentReportExcel, classReportExcel } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/student/:studentId/pdf', studentReportPDF);
router.get('/student/:studentId/excel', studentReportExcel);
router.get('/class/:classId/excel', authorize('teacher', 'admin'), classReportExcel);

module.exports = router;
