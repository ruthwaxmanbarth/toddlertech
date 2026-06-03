import { useEffect } from 'react';

interface CompletionCelebrationProps {
  onComplete: () => void;
}

export default function CompletionCelebration({ onComplete }: CompletionCelebrationProps) {
  useEffect(() => {
    // Play gentle alert sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioContext.currentTime;

    // Create a gentle beep pattern - soft sine wave tones
    const playBeep = (startTime: number, duration: number, frequency: number) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.type = 'sine';
      osc.frequency.value = frequency;

      // Soft envelope for gentle alert
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.1);
      gain.gain.setValueAtTime(0.15, startTime + duration - 0.1);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Play ascending tones for 5 seconds total
    const beepDuration = 0.4;
    const frequencies = [523, 659, 784]; // C5, E5, G5 - gentle ascending notes

    for (let i = 0; i < 12; i++) {
      const freq = frequencies[i % 3];
      playBeep(now + i * beepDuration, beepDuration - 0.05, freq);
    }

    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-white/95 flex items-center justify-center z-50 animate-fadeIn">
      <div className="text-center">
        <div className="text-7xl font-bold text-slate-900 mb-4">
          All Done!
        </div>

        <div className="text-6xl mb-6">
          ✓
        </div>

        <p className="text-2xl font-semibold text-slate-700">
          You finished your time.
        </p>
      </div>
    </div>
  );
}
