/**
 * Temporary Auth Helper
 *
 * This provides the church_id until we fully migrate to Supabase Auth.
 * For now, it returns the first church from the migration.
 *
 * TODO: Replace with actual Supabase Auth session
 */

import { supabaseAdmin } from './supabase';

export async function getTempChurchId(): Promise<string> {
  // Get the first church (from migration)
  const { data: churches, error } = await supabaseAdmin
    .from('churches')
    .select('id')
    .limit(1)
    .single();

  if (error || !churches) {
    throw new Error('No church found. Please run migration first.');
  }

  return churches.id;
}

export async function getTempClassId(): Promise<string> {
  // Get the first class (from migration)
  const { data: classes, error } = await supabaseAdmin
    .from('classes')
    .select('id')
    .limit(1)
    .single();

  if (error || !classes) {
    throw new Error('No class found. Please run migration first.');
  }

  return classes.id;
}
