/**
 * Seeds the database with an initial admin user, a sample department,
 * subject, teacher, and a couple of students — enough to log in and
 * explore the system immediately after deployment.
 *
 * Run with: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Department = require('../models/Department');
const Subject = require('../models/Subject');

const seed = async () => {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([User.deleteMany({}), Department.deleteMany({}), Subject.deleteMany({})]);

  console.log('Creating department...');
  const csDept = await Department.create({
    name: 'Computer Science & Engineering',
    code: 'CSE',
    description: 'Department of Computer Science and Engineering',
  });

  console.log('Creating admin user...');
  await User.create({
    name: 'System Admin',
    email: 'admin@attendance.com',
    password: 'Admin@123',
    role: 'admin',
  });

  console.log('Creating teacher...');
  const teacher = await User.create({
    name: 'Dr. Ravi Sharma',
    email: 'teacher@attendance.com',
    password: 'Teacher@123',
    role: 'teacher',
    department: csDept._id,
  });

  console.log('Creating subject...');
  const subject = await Subject.create({
    name: 'Data Structures & Algorithms',
    code: 'CSE301',
    department: csDept._id,
    semester: 3,
    teacher: teacher._id,
    credits: 4,
  });

  console.log('Creating students...');
  await User.create([
    {
      name: 'Aditi Verma',
      email: 'student1@attendance.com',
      password: 'Student@123',
      role: 'student',
      rollNumber: 'CSE2024001',
      department: csDept._id,
      subjects: [subject._id],
    },
    {
      name: 'Rohan Mehta',
      email: 'student2@attendance.com',
      password: 'Student@123',
      role: 'student',
      rollNumber: 'CSE2024002',
      department: csDept._id,
      subjects: [subject._id],
    },
  ]);

  console.log('\nSeed complete. Login credentials:');
  console.log('  Admin:   admin@attendance.com   / Admin@123');
  console.log('  Teacher: teacher@attendance.com / Teacher@123');
  console.log('  Student: student1@attendance.com / Student@123');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
