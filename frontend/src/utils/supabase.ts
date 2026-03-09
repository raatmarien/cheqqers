import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project URL and anon key.
// It is recommended to put these in a .env file later for security.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
