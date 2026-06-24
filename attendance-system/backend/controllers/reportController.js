const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const User = require('../models/User');
const ClassSession = require('../models/ClassSession');
const Attendance = require('../models/Attendance');
const asyncHandler = require('../utils/asyncHandler');
const { computeStudentAttendance } = require('../utils/attendanceCalculator');

/**
 * @route   GET /api/reports/student/:studentId/pdf
 * @desc    Generate a PDF attendance report for a single student
 * @access  Private (self, or teacher/admin)
 */
const studentReportPDF = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  if (req.user.role === 'student' && String(req.user._id) !== String(studentId)) {
    return res.status(403).json({ success: false, message: 'You can only view your own report' });
  }

  const student = await User.findById(studentId).populate('department', 'name');
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  const stats = await computeStudentAttendance(studentId);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="attendance_${student.rollNumber || student._id}.pdf"`);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.fontSize(18).fillColor('#2c3e50').text('Attendance Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(11).fillColor('#000');
  doc.text(`Student: ${student.name}`);
  doc.text(`Roll Number: ${student.rollNumber || 'N/A'}`);
  doc.text(`Email: ${student.email}`);
  doc.text(`Department: ${student.department ? student.department.name : 'N/A'}`);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`);
  doc.moveDown();

  doc.fontSize(13).fillColor('#2c3e50').text('Summary');
  doc.fontSize(11).fillColor('#000');
  doc.text(`Total Classes Counted: ${stats.totalClasses}`);
  doc.text(`Present: ${stats.present}   Absent: ${stats.absent}   Late: ${stats.late}   Excused: ${stats.excused}`);
  doc.fillColor(stats.percentage < 75 ? '#c0392b' : '#27ae60');
  doc.text(`Overall Attendance: ${stats.percentage}%`);
  doc.fillColor('#000');
  doc.moveDown();

  doc.fontSize(13).fillColor('#2c3e50').text('Detailed History');
  doc.moveDown(0.5);

  const tableTop = doc.y;
  const colX = { date: 50, subject: 150, status: 320, remarks: 400 };

  doc.fontSize(10).fillColor('#fff');
  doc.rect(50, tableTop, 500, 20).fill('#34495e');
  doc.fillColor('#fff');
  doc.text('Date', colX.date, tableTop + 5);
  doc.text('Subject', colX.subject, tableTop + 5);
  doc.text('Status', colX.status, tableTop + 5);
  doc.text('Remarks', colX.remarks, tableTop + 5);

  let y = tableTop + 22;
  doc.fillColor('#000').fontSize(9);

  stats.history.forEach((entry, idx) => {
    if (y > 720) {
      doc.addPage();
      y = 50;
    }
    if (idx % 2 === 0) {
      doc.rect(50, y - 2, 500, 18).fill('#f2f2f2');
      doc.fillColor('#000');
    }
    doc.text(new Date(entry.date).toLocaleDateString(), colX.date, y);
    doc.text(entry.subject ? `${entry.subject.name} (${entry.subject.code})` : 'N/A', colX.subject, y, { width: 160 });
    doc.text(entry.status.toUpperCase(), colX.status, y);
    doc.text(entry.remarks || '-', colX.remarks, y, { width: 140 });
    y += 18;
  });

  doc.end();
});

/**
 * @route   GET /api/reports/student/:studentId/excel
 * @desc    Generate an Excel attendance report for a single student
 * @access  Private (self, or teacher/admin)
 */
const studentReportExcel = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  if (req.user.role === 'student' && String(req.user._id) !== String(studentId)) {
    return res.status(403).json({ success: false, message: 'You can only view your own report' });
  }

  const student = await User.findById(studentId).populate('department', 'name');
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  const stats = await computeStudentAttendance(studentId);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Attendance Management System';

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [{ width: 28 }, { width: 30 }];
  summarySheet.addRow(['Student Name', student.name]);
  summarySheet.addRow(['Roll Number', student.rollNumber || 'N/A']);
  summarySheet.addRow(['Email', student.email]);
  summarySheet.addRow(['Department', student.department ? student.department.name : 'N/A']);
  summarySheet.addRow(['Total Classes Counted', stats.totalClasses]);
  summarySheet.addRow(['Present', stats.present]);
  summarySheet.addRow(['Absent', stats.absent]);
  summarySheet.addRow(['Late', stats.late]);
  summarySheet.addRow(['Excused', stats.excused]);
  summarySheet.addRow(['Overall Attendance %', stats.percentage]);
  summarySheet.getColumn(1).font = { bold: true };

  const historySheet = workbook.addWorksheet('Detailed History');
  historySheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Subject', key: 'subject', width: 25 },
    { header: 'Class', key: 'classSession', width: 20 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Remarks', key: 'remarks', width: 30 },
  ];
  historySheet.getRow(1).font = { bold: true };
  historySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF34495E' } };
  historySheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  });

  stats.history.forEach((entry) => {
    historySheet.addRow({
      date: new Date(entry.date).toLocaleDateString(),
      subject: entry.subject ? `${entry.subject.name} (${entry.subject.code})` : 'N/A',
      classSession: entry.classSession ? entry.classSession.name : 'N/A',
      status: entry.status.toUpperCase(),
      remarks: entry.remarks || '-',
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="attendance_${student.rollNumber || student._id}.xlsx"`
  );

  await workbook.xlsx.write(res);
  res.end();
});

/**
 * @route   GET /api/reports/class/:classId/excel
 * @desc    Generate an Excel sheet of attendance % for every student in a class
 * @access  Private/Teacher,Admin
 */
const classReportExcel = asyncHandler(async (req, res) => {
  const classSession = await ClassSession.findById(req.params.classId)
    .populate('students', 'name email rollNumber')
    .populate('subject', 'name code');

  if (!classSession) {
    return res.status(404).json({ success: false, message: 'Class not found' });
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Class Attendance');
  sheet.columns = [
    { header: 'Roll Number', key: 'roll', width: 15 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Total Classes', key: 'total', width: 15 },
    { header: 'Present', key: 'present', width: 10 },
    { header: 'Absent', key: 'absent', width: 10 },
    { header: 'Late', key: 'late', width: 10 },
    { header: 'Attendance %', key: 'percentage', width: 15 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF34495E' } };
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  });

  for (const student of classSession.students) {
    const stats = await computeStudentAttendance(student._id, { classSessionId: classSession._id });
    const row = sheet.addRow({
      roll: student.rollNumber || 'N/A',
      name: student.name,
      email: student.email,
      total: stats.totalClasses,
      present: stats.present,
      absent: stats.absent,
      late: stats.late,
      percentage: stats.percentage,
    });
    if (stats.percentage < (Number(process.env.LOW_ATTENDANCE_THRESHOLD) || 75)) {
      row.getCell('percentage').font = { color: { argb: 'FFC0392B' }, bold: true };
    }
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="class_${classSession.name}_attendance.xlsx"`);

  await workbook.xlsx.write(res);
  res.end();
});

module.exports = { studentReportPDF, studentReportExcel, classReportExcel };
