import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type TimerState = {
  id: string;
  start_time: string;
  target_end_time: string;
  duration_minutes: number;
  status: 'running' | 'paused' | 'completed' | 'cancelled';
  wake_lock_enabled: boolean;
  created_at: string;
  updated_at: string;
};
