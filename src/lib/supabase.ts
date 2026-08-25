import { createClient } from '@supabase/supabase-js';

// Read from Vite env
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

// Add validation to ensure the environment variables are loaded
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are missing. Please check your .env file or environment variables.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);

// Do NOT expose service role in the browser. If needed, handle admin ops via server.