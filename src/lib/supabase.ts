import { createClient } from '@supabase/supabase-js';

// Read from Vite env (define in .env.local)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Add validation to ensure the environment variables are loaded
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are missing. Please check your .env file or Netlify environment variables.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);

// Do NOT expose service role in the browser. If needed, handle admin ops via server.