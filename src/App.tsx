import { useState, useEffect, useCallback } from 'react';
import ClockFace from './components/ClockFace';
import TimerControls from './components/TimerControls';
import CompletionCelebration from './components/CompletionCelebration';
import { useWakeLock } from './hooks/useWakeLock';
import { supabase, TimerState } from './lib/supabase';
import { Sun } from 'lucide-react';

function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [targetEndTime, setTargetEndTime] = useState<Date | null>(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const [timerId, setTimerId] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { isWakeLocked, toggleWakeLock } = useWakeLock();

  // Load active timer from Supabase on mount
  useEffect(() => {
    loadActiveTimer();
  }, []);

  // Check for timer completion
  useEffect(() => {
    if (!isRunning || !targetEndTime) return;

    const checkCompletion = () => {
      const now = new Date();
      if (now >= targetEndTime) {
        setIsRunning(false);
        setShowCelebration(true);
        if (timerId) {
          updateTimerStatus(timerId, 'completed');
        }
      }
    };

    const interval = setInterval(checkCompletion, 100);
    return () => clearInterval(interval);
  }, [isRunning, targetEndTime, timerId]);

  // Remove scroll prevention logic - allow scroll at all times
  // (commented out code that was preventing body scroll when timer running)

  const loadActiveTimer = async () => {
    try {
      const { data, error } = await supabase
        .from('timer_states')
        .select('*')
        .eq('status', 'running')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const timer = data as TimerState;
        const endTime = new Date(timer.target_end_time);
        const now = new Date();

        // Only restore if the timer hasn't expired
        if (endTime > now) {
          setTargetEndTime(endTime);
          setTotalDuration(timer.duration_minutes * 60 * 1000);
          setIsRunning(true);
          setTimerId(timer.id);

          // Restore wake lock if needed
          if (timer.wake_lock_enabled) {
            toggleWakeLock();
          }
        } else {
          // Timer already expired, mark as completed
          await updateTimerStatus(timer.id, 'completed');
        }
      }
    } catch (error) {
      console.error('Error loading timer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTimerStatus = async (id: string, status: TimerState['status']) => {
    try {
      await supabase
        .from('timer_states')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
    } catch (error) {
      console.error('Error updating timer:', error);
    }
  };

  const startTimer = useCallback(
    async (duration: number) => {
      const now = new Date();
      const endTime = new Date(now.getTime() + duration);

      setTargetEndTime(endTime);
      setTotalDuration(duration);
      setIsRunning(true);

      try {
        const { data, error } = await supabase
          .from('timer_states')
          .insert({
            start_time: now.toISOString(),
            target_end_time: endTime.toISOString(),
            duration_minutes: Math.ceil(duration / 60000),
            status: 'running',
            wake_lock_enabled: isWakeLocked,
          })
          .select()
          .single();

        if (error) throw error;

        setTimerId((data as TimerState).id);
      } catch (error) {
        console.error('Error creating timer:', error);
      }
    },
    [isWakeLocked]
  );

  const startTimerUntil = useCallback(
    async (targetTime: Date) => {
      const now = new Date();
      const duration = targetTime.getTime() - now.getTime();

      if (duration <= 0) {
        alert('Please select a future time');
        return;
      }

      setTargetEndTime(targetTime);
      setTotalDuration(duration);
      setIsRunning(true);

      try {
        const { data, error } = await supabase
          .from('timer_states')
          .insert({
            start_time: now.toISOString(),
            target_end_time: targetTime.toISOString(),
            duration_minutes: Math.ceil(duration / 60000),
            status: 'running',
            wake_lock_enabled: isWakeLocked,
          })
          .select()
          .single();

        if (error) throw error;

        setTimerId((data as TimerState).id);
      } catch (error) {
        console.error('Error creating timer:', error);
      }
    },
    [isWakeLocked]
  );

  const cancelTimer = async () => {
    setIsRunning(false);
    setTargetEndTime(null);
    setTotalDuration(0);

    if (timerId) {
      await updateTimerStatus(timerId, 'cancelled');
      setTimerId(null);
    }

    if (isWakeLocked) {
      toggleWakeLock();
    }
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    setTargetEndTime(null);
    setTotalDuration(0);
    setTimerId(null);

    if (isWakeLocked) {
      toggleWakeLock();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center overflow-auto">
      {/* Clock Face */}
      <div className="flex items-center justify-center w-full px-4 py-8">
        <ClockFace
          targetEndTime={targetEndTime}
          totalDuration={totalDuration}
          isRunning={isRunning}
        />
      </div>

      {/* Controls */}
      <div className="pb-8 flex flex-col items-center">
        <TimerControls
          onStartTimer={startTimer}
          onStartTimerUntil={startTimerUntil}
          onCancel={cancelTimer}
          isRunning={isRunning}
          wakeLockEnabled={isWakeLocked}
          onToggleWakeLock={toggleWakeLock}
        />

        {/* Wake lock status indicator */}
        {isRunning && !isWakeLocked && (
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <Sun className="w-3 h-3" />
            Tap "Keep Screen On" to prevent sleep
          </p>
        )}
      </div>

      {/* Completion celebration */}
      {showCelebration && <CompletionCelebration onComplete={handleCelebrationComplete} />}
    </div>
  );
}

export default App;
