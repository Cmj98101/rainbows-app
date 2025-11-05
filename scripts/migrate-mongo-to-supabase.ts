/**
 * Data Migration Script: MongoDB → Supabase
 *
 * This script migrates existing data from MongoDB to Supabase,
 * transforming nested documents into relational tables.
 *
 * Run with: npx tsx scripts/migrate-mongo-to-supabase.ts
 */

import mongoose from 'mongoose';
import { supabaseAdmin } from '../src/lib/supabase';
import Student from '../src/models/Student';
import User from '../src/models/User';
import Test from '../src/models/Test';

interface MigrationStats {
  churches: number;
  users: number;
  classes: number;
  students: number;
  guardians: number;
  attendance: number;
  tests: number;
  testResults: number;
  errors: string[];
}

const stats: MigrationStats = {
  churches: 0,
  users: 0,
  classes: 0,
  students: 0,
  guardians: 0,
  attendance: 0,
  tests: 0,
  testResults: 0,
  errors: [],
};

async function connectMongoDB() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('✅ Connected to MongoDB\n');
}

async function disconnectMongoDB() {
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

async function createDefaultChurch() {
  console.log('🏛️  Creating default church...');

  const { data: church, error } = await supabaseAdmin
    .from('churches')
    .insert({
      name: 'First Church',
      subscription: 'free',
      address: {},
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating church:', error);
    stats.errors.push(`Church creation: ${error.message}`);
    throw error;
  }

  stats.churches = 1;
  console.log(`✅ Created church: ${church.name} (${church.id})\n`);

  return church.id;
}

async function migrateUsers(churchId: string) {
  console.log('👥 Migrating users...');

  const mongoUsers = await User.find({}).lean();
  console.log(`   Found ${mongoUsers.length} users in MongoDB`);

  for (const mongoUser of mongoUsers) {
    try {
      // Map MongoDB role to Supabase role
      let role: 'church_admin' | 'admin' | 'teacher' = 'teacher';
      if (mongoUser.role === 'admin') {
        role = 'church_admin'; // Assume MongoDB admins are church admins
      }

      const { error } = await supabaseAdmin.from('users').insert({
        id: mongoUser._id.toString(),
        church_id: churchId,
        email: mongoUser.email,
        name: mongoUser.name || mongoUser.email.split('@')[0],
        role: role,
        permissions: {
          canManageUsers: role === 'church_admin',
          canManageClasses: role === 'church_admin',
          canEditStudents: true,
          canTakeAttendance: true,
          canManageTests: true,
          canViewReports: role !== 'teacher',
        },
      });

      if (error) {
        console.error(`   ❌ Error migrating user ${mongoUser.email}:`, error.message);
        stats.errors.push(`User ${mongoUser.email}: ${error.message}`);
      } else {
        stats.users++;
      }
    } catch (error: any) {
      console.error(`   ❌ Error processing user:`, error.message);
      stats.errors.push(`User processing: ${error.message}`);
    }
  }

  console.log(`✅ Migrated ${stats.users}/${mongoUsers.length} users\n`);
}

async function createDefaultClass(churchId: string) {
  console.log('🎓 Creating default class...');

  const { data: classData, error } = await supabaseAdmin
    .from('classes')
    .insert({
      church_id: churchId,
      name: 'General Class',
      age_group: 'all',
      description: 'Default class for migrated students',
      schedule: {},
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating class:', error);
    stats.errors.push(`Class creation: ${error.message}`);
    throw error;
  }

  stats.classes = 1;
  console.log(`✅ Created class: ${classData.name} (${classData.id})\n`);

  return classData.id;
}

async function migrateStudents(churchId: string, classId: string) {
  console.log('👶 Migrating students...');

  const mongoStudents = await Student.find({}).lean();
  console.log(`   Found ${mongoStudents.length} students in MongoDB`);

  for (const mongoStudent of mongoStudents) {
    try {
      // Insert student
      const { data: student, error: studentError } = await supabaseAdmin
        .from('students')
        .insert({
          id: mongoStudent._id.toString(),
          church_id: churchId,
          class_id: classId,
          first_name: mongoStudent.firstName,
          last_name: mongoStudent.lastName,
          birthday: mongoStudent.birthday || null,
          gender: mongoStudent.gender || null,
          email: mongoStudent.email || null,
          phone: mongoStudent.phone || null,
          address: mongoStudent.address || {},
        })
        .select()
        .single();

      if (studentError) {
        console.error(`   ❌ Error migrating student ${mongoStudent.firstName}:`, studentError.message);
        stats.errors.push(`Student ${mongoStudent.firstName}: ${studentError.message}`);
        continue;
      }

      stats.students++;

      // Migrate guardians (nested array → separate table)
      if (mongoStudent.guardians && mongoStudent.guardians.length > 0) {
        for (const guardian of mongoStudent.guardians) {
          const { error: guardianError } = await supabaseAdmin
            .from('guardians')
            .insert({
              student_id: student.id,
              name: guardian.name,
              relationship: guardian.relationship || null,
              phone: guardian.phone || null,
              email: guardian.email || null,
              address: guardian.address || {},
              is_emergency_contact: guardian.isEmergencyContact || false,
            });

          if (guardianError) {
            stats.errors.push(`Guardian for ${mongoStudent.firstName}: ${guardianError.message}`);
          } else {
            stats.guardians++;
          }
        }
      }

      // Migrate attendance (nested array → separate table)
      if (mongoStudent.attendance && mongoStudent.attendance.length > 0) {
        for (const att of mongoStudent.attendance) {
          const { error: attError } = await supabaseAdmin
            .from('attendance')
            .insert({
              student_id: student.id,
              class_id: classId,
              date: att.date,
              present: att.present,
            });

          if (attError && !attError.message.includes('duplicate')) {
            stats.errors.push(`Attendance for ${mongoStudent.firstName}: ${attError.message}`);
          } else if (!attError) {
            stats.attendance++;
          }
        }
      }

    } catch (error: any) {
      console.error(`   ❌ Error processing student:`, error.message);
      stats.errors.push(`Student processing: ${error.message}`);
    }
  }

  console.log(`✅ Migrated ${stats.students}/${mongoStudents.length} students`);
  console.log(`✅ Migrated ${stats.guardians} guardians`);
  console.log(`✅ Migrated ${stats.attendance} attendance records\n`);
}

async function migrateTests(churchId: string, classId: string) {
  console.log('📝 Migrating tests...');

  const mongoTests = await Test.find({}).lean();
  console.log(`   Found ${mongoTests.length} tests in MongoDB`);

  for (const mongoTest of mongoTests) {
    try {
      // Insert test
      const { data: test, error: testError } = await supabaseAdmin
        .from('tests')
        .insert({
          id: mongoTest._id.toString(),
          church_id: churchId,
          class_id: classId,
          name: mongoTest.name,
          date: mongoTest.date,
        })
        .select()
        .single();

      if (testError) {
        console.error(`   ❌ Error migrating test ${mongoTest.name}:`, testError.message);
        stats.errors.push(`Test ${mongoTest.name}: ${testError.message}`);
        continue;
      }

      stats.tests++;

      // Migrate test results from students
      const studentsWithResults = await Student.find({
        'testResults.testId': mongoTest._id.toString(),
      }).lean();

      for (const student of studentsWithResults) {
        const result = student.testResults?.find(
          (r: any) => r.testId.toString() === mongoTest._id.toString()
        );

        if (result) {
          const { error: resultError } = await supabaseAdmin
            .from('test_results')
            .insert({
              test_id: test.id,
              student_id: student._id.toString(),
              status: result.status,
            });

          if (resultError && !resultError.message.includes('duplicate')) {
            stats.errors.push(`Test result: ${resultError.message}`);
          } else if (!resultError) {
            stats.testResults++;
          }
        }
      }

    } catch (error: any) {
      console.error(`   ❌ Error processing test:`, error.message);
      stats.errors.push(`Test processing: ${error.message}`);
    }
  }

  console.log(`✅ Migrated ${stats.tests}/${mongoTests.length} tests`);
  console.log(`✅ Migrated ${stats.testResults} test results\n`);
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Churches:        ${stats.churches}`);
  console.log(`Users:           ${stats.users}`);
  console.log(`Classes:         ${stats.classes}`);
  console.log(`Students:        ${stats.students}`);
  console.log(`Guardians:       ${stats.guardians}`);
  console.log(`Attendance:      ${stats.attendance}`);
  console.log(`Tests:           ${stats.tests}`);
  console.log(`Test Results:    ${stats.testResults}`);
  console.log('='.repeat(60));

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  ${stats.errors.length} errors occurred:\n`);
    stats.errors.forEach((error, i) => {
      console.log(`${i + 1}. ${error}`);
    });
  } else {
    console.log('\n✅ Migration completed successfully with no errors!');
  }

  console.log('\n');
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 MONGODB → SUPABASE MIGRATION');
  console.log('='.repeat(60) + '\n');

  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Create default church
    const churchId = await createDefaultChurch();

    // Migrate users
    await migrateUsers(churchId);

    // Create default class
    const classId = await createDefaultClass(churchId);

    // Migrate students (includes guardians and attendance)
    await migrateStudents(churchId, classId);

    // Migrate tests and test results
    await migrateTests(churchId, classId);

    // Print summary
    await printSummary();

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    stats.errors.push(`Fatal error: ${error.message}`);
  } finally {
    await disconnectMongoDB();
  }
}

// Run migration
main();
