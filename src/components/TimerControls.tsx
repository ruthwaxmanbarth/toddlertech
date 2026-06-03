import { useState } from 'react';

interface TimerControlsProps {
  onStartTimer: (duration: number) => void;
  onStartTimerUntil: (targetTime: Date) => void;
  onCancel: () => void;
  isRunning: boolean;
  wakeLockEnabled: boolean;
  onToggleWakeLock: () => void;
}

const PRESETS = [
  { label: '5m', minutes: 5 },
  { label: '10m', minutes: 10 },
  { label: '15m', minutes: 15 },
  { label: '20m', minutes: 20 },
  { label: '30m', minutes: 30 },
  { label: '45m', minutes: 45 },
];

export default function TimerControls({
  onStartTimer,
  onStartTimerUntil,
  onCancel,
  isRunning,
  wakeLockEnabled,
  onToggleWakeLock,
}: TimerControlsProps) {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(7);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedAmPm, setSelectedAmPm] = useState<'AM' | 'PM'>('PM');

  const handleTimePickerSubmit = () => {
    const now = new Date();
    let targetHour = selectedHour;

    if (selectedAmPm === 'PM' && selectedHour !== 12) {
      targetHour = selectedHour + 12;
    } else if (selectedAmPm === 'AM' && selectedHour === 12) {
      targetHour = 0;
    }

    let targetDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      targetHour,
      selectedMinute,
      0,
      0
    );

    // If the target time has already passed today, assume tomorrow
    if (targetDate.getTime() <= now.getTime()) {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    // Check if duration exceeds 59 minutes
    const durationMs = targetDate.getTime() - now.getTime();
    const durationMins = Math.ceil(durationMs / 60000);

    if (durationMins > 59) {
      alert('Timer must be 59 minutes or less. Please select a time closer to now.');
      return;
    }

    onStartTimerUntil(targetDate);
    setShowTimePicker(false);
  };

  // Initialize time picker to current time + 10 minutes as default
  const initializeTimePicker = () => {
    const now = new Date();
    const futureTime = new Date(now.getTime() + 10 * 60000);
    const hours = futureTime.getHours();
    const mins = futureTime.getMinutes();

    if (hours === 0) {
      setSelectedHour(12);
      setSelectedAmPm('AM');
    } else if (hours < 12) {
      setSelectedHour(hours);
      setSelectedAmPm('AM');
    } else if (hours === 12) {
      setSelectedHour(12);
      setSelectedAmPm('PM');
    } else {
      setSelectedHour(hours - 12);
      setSelectedAmPm('PM');
    }
    setSelectedMinute(Math.round(mins / 5) * 5);
  };

  // Call initialization when opening the picker
  const handleOpenTimePicker = () => {
    initializeTimePicker();
    setShowTimePicker(true);
  };

  return (
    <div className="w-full max-w-md px-4">
      {!isRunning ? (
        <>
          {/* Preset duration buttons */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {PRESETS.map((preset) => (
              <button
                key={preset.minutes}
                onClick={() => onStartTimer(preset.minutes * 60 * 1000)}
                className="py-3 px-2 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white font-semibold rounded-lg transition-all duration-150 text-lg"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom time picker toggle */}
          <button
            onClick={handleOpenTimePicker}
            className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-500 active:bg-teal-400 text-white font-semibold rounded-lg transition-all duration-150 text-lg mb-2"
          >
            Set End Time...
          </button>

          {/* Note about 59-minute limit */}
          <p className="text-xs text-slate-500 text-center mb-2">
            Timer limited to 59 minutes or less
          </p>

          {/* Time picker modal */}
          {showTimePicker && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fadeIn">
              <div className="bg-slate-800 rounded-2xl p-6 w-80 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4 text-center">
                  Set End Time
                </h3>

                <div className="flex gap-2 justify-center items-center mb-6">
                  {/* Hour selector */}
                  <select
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                    className="bg-slate-700 text-white text-2xl font-bold px-3 py-2 rounded-lg w-20 text-center appearance-none cursor-pointer"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>

                  <span className="text-white text-2xl font-bold">:</span>

                  {/* Minute selector */}
                  <select
                    value={selectedMinute}
                    onChange={(e) => setSelectedMinute(parseInt(e.target.value))}
                    className="bg-slate-700 text-white text-2xl font-bold px-3 py-2 rounded-lg w-20 text-center appearance-none cursor-pointer"
                  >
                    {[...Array(60)].map((_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>

                  {/* AM/PM selector */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => setSelectedAmPm('AM')}
                      className={`px-3 py-1 rounded text-sm font-bold ${
                        selectedAmPm === 'AM'
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      AM
                    </button>
                    <button
                      onClick={() => setSelectedAmPm('PM')}
                      className={`px-3 py-1 rounded text-sm font-bold ${
                        selectedAmPm === 'PM'
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      PM
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowTimePicker(false)}
                    className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTimePickerSubmit}
                    className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-semibold"
                  >
                    Start
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Cancel button */}
          <button
            onClick={onCancel}
            className="w-full py-4 px-4 bg-red-600 hover:bg-red-500 active:bg-red-400 text-white font-bold rounded-lg transition-all duration-150 text-xl mb-3"
          >
            Cancel Timer
          </button>

          {/* Wake Lock toggle */}
          <button
            onClick={onToggleWakeLock}
            className={`w-full py-3 px-4 rounded-lg transition-all duration-150 text-lg font-semibold flex items-center justify-center gap-3 ${
              wakeLockEnabled
                ? 'bg-amber-500 hover:bg-amber-400 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            {wakeLockEnabled ? (
              <>
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                Screen Will Stay On
              </>
            ) : (
              <>
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
                Keep Screen On
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
