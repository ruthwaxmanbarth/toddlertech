import { useEffect, useState } from 'react';

interface ClockFaceProps {
  targetEndTime: Date | null;
  totalDuration: number; // in milliseconds
  isRunning: boolean;
}

export default function ClockFace({ targetEndTime, totalDuration: _totalDuration, isRunning }: ClockFaceProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (targetEndTime && isRunning) {
        const remaining = targetEndTime.getTime() - now.getTime();
        setRemainingMs(Math.max(0, remaining));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [targetEndTime, isRunning]);

  const hours = currentTime.getHours() % 12;
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();

  const hourAngle = ((hours + minutes / 60) / 12) * 360 - 90;
  const minuteAngle = ((minutes + seconds / 60) / 60) * 360 - 90;
  const secondAngle = (seconds / 60) * 360 - 90;

  const formatTimeRemaining = () => {
    if (!isRunning || remainingMs === 0) return null;

    const totalSeconds = Math.ceil(remainingMs / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    if (mins > 0) {
      return `${mins} min${mins !== 1 ? 's' : ''}`;
    } else {
      return `${secs} sec${secs !== 1 ? 's' : ''}`;
    }
  };

  const formatTargetTime = () => {
    if (!targetEndTime) return null;
    const targetHours = targetEndTime.getHours();
    const mins = targetEndTime.getMinutes();
    const ampm = targetHours >= 12 ? 'PM' : 'AM';
    const displayHours = targetHours % 12 || 12;
    return `until ${displayHours}:${mins.toString().padStart(2, '0')} ${ampm}`;
  };

  // Converts a clock-face degree (0 = top/12, clockwise) to SVG x/y
  const polarToCartesian = (angleDeg: number, radius: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: 200 + radius * Math.cos(rad),
      y: 200 + radius * Math.sin(rad),
    };
  };

  // Wedge from startDeg to endDeg (both in clock-face degrees: 0 = 12 o'clock, clockwise)
  // Always sweeps clockwise from start to end
  const createWedgePath = (startDeg: number, endDeg: number, radius: number) => {
    // Ensure we sweep clockwise: if endDeg <= startDeg, add 360 to wrap around
    let adjustedEnd = endDeg;
    if (adjustedEnd <= startDeg) {
      adjustedEnd += 360;
    }
    const sweepAngle = adjustedEnd - startDeg;

    // Don't render if wedge is essentially zero
    if (sweepAngle < 0.5) return '';

    const start = polarToCartesian(startDeg, radius);
    const end = polarToCartesian(adjustedEnd, radius);
    const largeArcFlag = sweepAngle > 180 ? 1 : 0;

    return [
      'M', 200, 200,
      'L', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 1, end.x, end.y,
      'Z',
    ].join(' ');
  };

  // Wedge: starts at current minute hand position, ends at target minute position
  // Both expressed as clock-face degrees (0 = 12 o'clock, clockwise)
  const currentMinuteDeg = (minutes + seconds / 60) * 6; // 6° per minute

  const targetMinuteDeg = targetEndTime
    ? targetEndTime.getMinutes() * 6
    : 0;

  const wedgePath =
    isRunning && targetEndTime
      ? createWedgePath(currentMinuteDeg, targetMinuteDeg, 170)
      : '';

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 400 400"
        className="w-full max-w-[380px] aspect-square drop-shadow-2xl"
      >
        {/* Clock face - white for high contrast */}
        <circle cx="200" cy="200" r="190" fill="#ffffff" stroke="#1e293b" strokeWidth="6" />

        {/* Countdown wedge - live start (current minute) to fixed end (target minute) */}
        {wedgePath && (
          <path d={wedgePath} fill="#fb923c" opacity="0.55" />
        )}

        {/* 60 tick marks: hour ticks every 5, minute ticks between */}
        {[...Array(60)].map((_, i) => {
          const isHourMark = i % 5 === 0;
          const angleDeg = (i / 60) * 360 - 90;
          const inner = polarToCartesian(angleDeg, isHourMark ? 165 : 175);
          const outer = polarToCartesian(angleDeg, isHourMark ? 187 : 183);
          return (
            <line
              key={i}
              x1={inner.x} y1={inner.y}
              x2={outer.x} y2={outer.y}
              stroke="#1e293b"
              strokeWidth={isHourMark ? 3 : 1.5}
              strokeLinecap="round"
            />
          );
        })}

        {/* Hour numbers 1–12 */}
        {[...Array(12)].map((_, i) => {
          const hour = i + 1;
          const angleDeg = ((hour / 12) * 360 - 90);
          const rad = angleDeg * (Math.PI / 180);
          const x = 200 + 145 * Math.cos(rad);
          const y = 200 + 145 * Math.sin(rad);
          return (
            <text
              key={hour}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="30"
              fontWeight="bold"
              fill="#1e293b"
            >
              {hour}
            </text>
          );
        })}

        {/* Target dot at the fixed end of the wedge */}
        {isRunning && targetEndTime && (
          <circle
            cx={polarToCartesian(targetMinuteDeg, 170).x}
            cy={polarToCartesian(targetMinuteDeg, 170).y}
            r="7"
            fill="#ff6b35"
            stroke="#1e293b"
            strokeWidth="2"
          />
        )}

        {/* Hour hand - dark blue */}
        <line
          x1="200" y1="200"
          x2={200 + 72 * Math.cos((hourAngle * Math.PI) / 180)}
          y2={200 + 72 * Math.sin((hourAngle * Math.PI) / 180)}
          stroke="#1e40af"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Minute hand - near black */}
        <line
          x1="200" y1="200"
          x2={200 + 115 * Math.cos((minuteAngle * Math.PI) / 180)}
          y2={200 + 115 * Math.sin((minuteAngle * Math.PI) / 180)}
          stroke="#0f172a"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Second hand - orange */}
        <line
          x1="200" y1="200"
          x2={200 + 120 * Math.cos((secondAngle * Math.PI) / 180)}
          y2={200 + 120 * Math.sin((secondAngle * Math.PI) / 180)}
          stroke="#fb923c"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Center cap */}
        <circle cx="200" cy="200" r="10" fill="#1e40af" />
      </svg>

      {/* Time remaining - below the clock, not overlaid */}
      {isRunning && (
        <div className="mt-5 text-center">
          <div className="text-6xl font-bold text-slate-100 tabular-nums">
            {formatTimeRemaining()}
          </div>
          <p className="text-lg font-semibold text-slate-400 mt-1">
            {formatTargetTime()}
          </p>
        </div>
      )}
    </div>
  );
}
