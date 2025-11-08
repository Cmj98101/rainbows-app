/**
 * User Migration Script: MongoDB → Supabase
 *
 * This script migrates a single user from MongoDB to Supabase
 *
 * Usage:
 *   npx tsx scripts/migrate-user.ts <email> <password>
 */

// Load environment variables FIRST (before any imports)
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

import { supabaseAdmin } from '../src/lib/supabase';

interface MongoUser {
  email: string;
  name: string;
  role: 'church_admin' | 'admin' | 'teacher';
  churchId: string;
}

async function migrateUser(email: string, password: string) {
  try {
    console.log(`\n🔄 Starting migration for: ${email}\n`);

    // Step 1: Get user data from MongoDB (you'll need to provide this)
    console.log('📋 Please provide the following information about the user:\n');

    // You'll need to fill in these values from your MongoDB data
    const userData: MongoUser = {
      email: email,
      name: '', // FILL THIS IN from MongoDB
      role: 'teacher', // FILL THIS IN from MongoDB (church_admin, admin, or teacher)
      churchId: '', // FILL THIS IN - the Supabase church UUID
    };

    console.log('User data to migrate:');
    console.log(userData);
    console.log('\n⚠️  Make sure to fill in the userData object in the script!\n');

    if (!userData.name || !userData.churchId) {
      throw new Error('Please fill in the userData object in the script');
    }

    // Step 2: Create user in Supabase Auth
    console.log('1️⃣  Creating user in Supabase Auth...');
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: password,
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    console.log(`✅ Auth user created with ID: ${authUser.user.id}`);

    // Step 3: Set default permissions based on role
    let permissions = {
      canManageUsers: false,
      canManageClasses: false,
      canEditStudents: true,
      canTakeAttendance: true,
      canManageTests: true,
      canViewReports: false,
    };

    if (userData.role === 'church_admin') {
      permissions = {
        canManageUsers: true,
        canManageClasses: true,
        canEditStudents: true,
        canTakeAttendance: true,
        canManageTests: true,
        canViewReports: true,
      };
    } else if (userData.role === 'admin') {
      permissions = {
        canManageUsers: true,
        canManageClasses: true,
        canEditStudents: true,
        canTakeAttendance: true,
        canManageTests: true,
        canViewReports: true,
      };
    }

    // Step 4: Create user profile in users table
    console.log('2️⃣  Creating user profile in users table...');
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        church_id: userData.churchId,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        permissions: permissions,
      })
      .select()
      .single();

    if (profileError) {
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }

    console.log(`✅ User profile created`);

    // Step 5: Success!
    console.log('\n🎉 Migration completed successfully!\n');
    console.log('User details:');
    console.log('-------------');
    console.log(`Email: ${userData.email}`);
    console.log(`Name: ${userData.name}`);
    console.log(`Role: ${userData.role}`);
    console.log(`Church ID: ${userData.churchId}`);
    console.log(`Auth ID: ${authUser.user.id}`);
    console.log('\n✅ User can now sign in with their email and the password you provided.\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Get email and password from command line arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('\n❌ Usage: npx tsx scripts/migrate-user.ts <email> <password>\n');
  console.log('Example: npx tsx scripts/migrate-user.ts teacher@example.com MyPassword123\n');
  process.exit(1);
}

// Run the migration
migrateUser(email, password);
