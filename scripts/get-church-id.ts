/**
 * Get Church ID Helper
 *
 * This script displays all churches in your Supabase database
 * so you can find the UUID to use for user migration.
 *
 * Usage:
 *   npx tsx scripts/get-church-id.ts
 */

// Load environment variables FIRST (before any imports)
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

import { supabaseAdmin } from '../src/lib/supabase';

async function getChurches() {
  try {
    console.log('\n📋 Fetching churches from Supabase...\n');

    const { data: churches, error } = await supabaseAdmin
      .from('churches')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    if (!churches || churches.length === 0) {
      console.log('⚠️  No churches found in the database.\n');
      console.log('Please create a church first by visiting /onboarding\n');
      return;
    }

    console.log(`Found ${churches.length} church(es):\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    for (const church of churches) {
      console.log(`🏛️  ${church.name}`);
      console.log(`   UUID: ${church.id}`);
      console.log(`   Address: ${church.address || 'N/A'}`);
      console.log(`   Created: ${new Date(church.created_at).toLocaleDateString()}`);
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('💡 Copy the UUID above and use it in the migration script.\n');

  } catch (error) {
    console.error('\n❌ Error fetching churches:', error);
    process.exit(1);
  }
}

getChurches();
