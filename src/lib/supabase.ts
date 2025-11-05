import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Get environment variables with validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error(
    '❌ Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
    'Please add it to .env.local and restart the dev server.'
  );
}

if (!supabaseAnonKey && typeof window !== 'undefined') {
  throw new Error(
    '❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
    'Please add it to .env.local and restart the dev server.'
  );
}

if (!supabaseServiceKey && typeof window === 'undefined') {
  throw new Error(
    '❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
    'Please add it to .env.local and restart the dev server.'
  );
}

// Supabase client for server-side use (with service role key)
// Use this in API routes and server components
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Supabase client for client-side use (with anon key)
// Use this in client components
export const supabaseClient = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
