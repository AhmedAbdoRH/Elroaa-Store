import { createClient } from '@supabase/supabase-js';

// Read from Vite env (define in .env.local)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Add validation to ensure the environment variables are loaded
if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key loaded:', !!supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Do NOT expose service role in the browser. If needed, handle admin ops via server.