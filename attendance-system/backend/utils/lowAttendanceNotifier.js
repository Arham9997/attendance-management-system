const User = require('../models/User');
const { sendEmail } = require('../config/email');
const { computeStudentAttendance } = require('./attendanceCalculator');

const THROTTLE_HOURS = 24; // don't re-email the same student more than once per day

/**
 * Given a list of student IDs (typically the students just marked in an
 * attendance session), recompute each one's overall percentage and send
 * a low-attendance email if it falls below the configured threshold.
 * Throttled per-student so repeated absences in one day don't spam inboxes.
 */
const checkAndNotifyLowAttendance = async (studentIds) => {
  const threshold = Number(process.env.LOW_ATTENDANCE_THRESHOLD) || 75;
  const uniqueIds = [...new Set(studentIds.map(String))];

  for (const studentId of uniqueIds) {
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') continue;

    const stats = await computeStudentAttendance(studentId);
    if (stats.percentage >= threshold) continue;

    const lastSent = student.lowAttendanceAlertSentAt;
    if (lastSent && Date.now() - new Date(lastSent).getTime() < THROTTLE_HOURS * 60 * 60 * 1000) {
      continue; // already notified recently
    }

    try {
      await sendEmail({
        to: student.email,
        subject: 'Low Attendance Alert',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px;">
            <h2 style="color:#c0392b;">Low Attendance Alert</h2>
            <p>Dear ${student.name},</p>
            <p>This is an automated notice that your overall attendance has dropped to
              <strong>${stats.percentage}%</strong>, which is below the required minimum of
              <strong>${threshold}%</strong>.</p>
            <p>Total classes counted: ${stats.totalClasses} &nbsp;|&nbsp;
               Present: ${stats.present} &nbsp;|&nbsp; Absent: ${stats.absent}</p>
            <p>Please reach out to your department or class teacher if you believe this is in error,
               or to discuss how to improve your attendance.</p>
            <p style="color:#888; font-size:12px;">This is an automated message from the Attendance Management System.</p>
          </div>
        `,
      });

      student.lowAttendanceAlertSentAt = new Date();
      await student.save();
    } catch (emailErr) {
      // Don't let a failed email (e.g. bad SMTP creds in dev) break the attendance flow
      console.error(`Failed to send low-attendance email to ${student.email}:`, emailErr.message);
    }
  }
};

module.exports = { checkAndNotifyLowAttendance };
