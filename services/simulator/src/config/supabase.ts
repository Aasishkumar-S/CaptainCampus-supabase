import path from 'path';
import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing simulator Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the repository root .env file.'
  );
}

if (supabaseKey === 'your_service_role_key') {
  throw new Error(
    'The simulator is still using the placeholder SUPABASE_SERVICE_ROLE_KEY. Replace it with the server-only key from Supabase Project Settings > API.'
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);
