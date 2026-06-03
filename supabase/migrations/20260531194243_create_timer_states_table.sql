/*
  # Create timer_states table for countdown timer persistence

  1. New Tables
    - `timer_states`
      - `id` (uuid, primary key) - unique identifier for each timer session
      - `start_time` (timestamptz) - when the timer was started
      - `target_end_time` (timestamptz) - when the timer should end
      - `duration_minutes` (integer) - total duration in minutes
      - `status` (text) - current status: 'running', 'paused', 'completed', 'cancelled'
      - `wake_lock_enabled` (boolean) - whether screen wake lock was active
      - `created_at` (timestamptz) - record creation timestamp
      - `updated_at` (timestamptz) - last update timestamp

  2. Security
    - Enable RLS on `timer_states` table
    - Add policy for public read/write access (simple app with no auth required)
  
  3. Notes
    - Only one active timer should exist at a time (application logic will enforce this)
    - Timer state persists across page refreshes so toddlers don't lose their countdown
    - Status transitions: running -> paused/completed/cancelled
*/

CREATE TABLE IF NOT EXISTS timer_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time timestamptz NOT NULL,
  target_end_time timestamptz NOT NULL,
  duration_minutes integer NOT NULL,
  status text NOT NULL DEFAULT 'running',
  wake_lock_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE timer_states ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (no auth required for this simple app)
CREATE POLICY "Allow public access to timer states"
  ON timer_states
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for faster queries on active timers
CREATE INDEX IF NOT EXISTS idx_timer_states_status ON timer_states(status);
CREATE INDEX IF NOT EXISTS idx_timer_states_created_at ON timer_states(created_at DESC);
