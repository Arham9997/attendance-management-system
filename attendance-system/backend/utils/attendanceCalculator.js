const Attendance = require('../models/Attendance');

/**
 * Computes attendance stats for a single student, optionally scoped to one subject.
 * "Present" and "late" both count toward attended sessions; "excused" sessions
 * are excluded entirely from the denominator (don't penalize or help the percentage).
 */
const computeStudentAttendance = async (studentId, { subjectId, classSessionId, from, to } = {}) => {
  const match = { 'records.student': studentId };
  if (subjectId) match.subject = subjectId;
  if (classSessionId) match.classSession = classSessionId;
  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = new Date(from);
    if (to) match.date.$lte = new Date(to);
  }

  const attendanceDocs = await Attendance.find(match)
    .populate('subject', 'name code')
    .populate('classSession', 'name')
    .sort({ date: 1 })
    .lean();

  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;
  const history = [];

  attendanceDocs.forEach((doc) => {
    const record = doc.records.find((r) => String(r.student) === String(studentId));
    if (!record) return;

    if (record.status === 'present') present++;
    else if (record.status === 'absent') absent++;
    else if (record.status === 'late') late++;
    else if (record.status === 'excused') excused++;

    history.push({
      date: doc.date,
      subject: doc.subject,
      classSession: doc.classSession,
      status: record.status,
      remarks: record.remarks || '',
    });
  });

  const totalCounted = present + absent + late; // excused excluded from denominator
  const attended = present + late;
  const percentage = totalCounted === 0 ? 0 : Math.round((attended / totalCounted) * 10000) / 100;

  return {
    totalClasses: totalCounted,
    present,
    absent,
    late,
    excused,
    percentage,
    history,
  };
};

module.exports = { computeStudentAttendance };
