interface CompletionCelebrationProps {
  onComplete: () => void;
}

export default function CompletionCelebration({ onComplete }: CompletionCelebrationProps) {
  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    onComplete();
  }, 3000);

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
