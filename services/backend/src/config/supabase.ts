import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

/**
 * Backend Supabase client using the Service Role key.
 * This bypasses Row Level Security (RLS) — ONLY use on the server side.
 * Never expose the service role key to the client/browser.
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
});

/**
 * Creates a Supabase client for verifying user JWTs.
 * Uses the anon key so JWT verification works correctly.
 */
export function createUserClient(accessToken: string): SupabaseClient {
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseAnonKey) {
    throw new Error('SUPABASE_ANON_KEY is not set');
  }
  return createClient(supabaseUrl!, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Helper: get server-side timestamp as ISO string
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Helper: get current timestamp in milliseconds
 */
export function nowMs(): number {
  return Date.now();
}
