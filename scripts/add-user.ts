/**
 * Quick Add User Script
 *
 * This script adds a new user to your Supabase database.
 * Use this to quickly migrate individual users from MongoDB.
 *
 * Usage:
 *   npx tsx scripts/add-user.ts
 *
 * The script will prompt you for the required information.
 */

// Load environment variables FIRST (before any imports)
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

import { supabaseAdmin } from '../src/lib/supabase';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function addUser() {
  try {
    console.log('\n🎯 Add New User to Supabase\n');
    console.log('This will create a new user account.\n');

    // Get church ID
    const { data: churches } = await supabaseAdmin
      .from('churches')
      .select('id, name')
      .order('name', { ascending: true });

    if (!churches || churches.length === 0) {
      console.log('❌ No churches found. Please create a church first at /onboarding\n');
      rl.close();
      return;
    }

    console.log('Available churches:');
    churches.forEach((church, index) => {
      console.log(`  ${index + 1}. ${church.name} (${church.id})`);
    });
    console.log('');

    const churchIndex = await question('Select church (enter number): ');
    const selectedChurch = churches[parseInt(churchIndex) - 1];

    if (!selectedChurch) {
      console.log('❌ Invalid selection\n');
      rl.close();
      return;
    }

    // Get user details
    const email = await question('Email: ');
    const name = await question('Full Name: ');
    const password = await question('Temporary Password: ');

    console.log('\nSelect role:');
    console.log('  1. Church Admin (full access)');
    console.log('  2. Admin (full access)');
    console.log('  3. Teacher (limited access)\n');

    const roleChoice = await question('Enter number: ');
    const roles = ['church_admin', 'admin', 'teacher'];
    const role = roles[parseInt(roleChoice) - 1];

    if (!role) {
      console.log('❌ Invalid role selection\n');
      rl.close();
      return;
    }

    console.log('\n📝 Summary:');
    console.log('─────────────────────────────────────');
    console.log(`Church: ${selectedChurch.name}`);
    console.log(`Email: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`Role: ${role}`);
    console.log('─────────────────────────────────────\n');

    const confirm = await question('Create this user? (yes/no): ');

    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Cancelled\n');
      rl.close();
      return;
    }

    // Create auth user
    console.log('\n1️⃣  Creating auth user...');
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    console.log(`✅ Auth user created: ${authUser.user.id}`);

    // Set permissions
    let permissions = {
      canManageUsers: false,
      canManageClasses: false,
      canEditStudents: true,
      canTakeAttendance: true,
      canManageTests: true,
      canViewReports: false,
    };

    if (role === 'church_admin' || role === 'admin') {
      permissions = {
        canManageUsers: true,
        canManageClasses: true,
        canEditStudents: true,
        canTakeAttendance: true,
        canManageTests: true,
        canViewReports: true,
      };
    }

    // Create user profile
    console.log('2️⃣  Creating user profile...');
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        church_id: selectedChurch.id,
        email,
        name,
        role,
        permissions,
      })
      .select()
      .single();

    if (profileError) {
      // Rollback
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }

    console.log(`✅ User profile created`);

    console.log('\n🎉 Success!\n');
    console.log('User details:');
    console.log('─────────────────────────────────────');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${role}`);
    console.log(`Church: ${selectedChurch.name}`);
    console.log('─────────────────────────────────────\n');
    console.log('✅ User can now sign in at /auth/signin\n');

    rl.close();
  } catch (error) {
    console.error('\n❌ Error:', error);
    rl.close();
    process.exit(1);
  }
}

addUser();
