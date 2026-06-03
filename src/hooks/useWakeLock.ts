import { useState, useEffect, useCallback } from 'react';

export function useWakeLock() {
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('wakeLock' in navigator);
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (!isSupported) {
      console.warn('Wake Lock API not supported');
      return;
    }

    try {
      const sentinel = await navigator.wakeLock.request('screen');
      setWakeLock(sentinel);

      sentinel.addEventListener('release', () => {
        setWakeLock(null);
      });
    } catch (err) {
      console.error('Failed to request wake lock:', err);
    }
  }, [isSupported]);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock) {
      await wakeLock.release();
      setWakeLock(null);
    }
  }, [wakeLock]);

  const toggleWakeLock = useCallback(() => {
    if (wakeLock) {
      releaseWakeLock();
    } else {
      requestWakeLock();
    }
  }, [wakeLock, releaseWakeLock, requestWakeLock]);

  // Re-acquire wake lock when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && wakeLock) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [wakeLock, requestWakeLock]);

  return {
    isWakeLocked: wakeLock !== null,
    isSupported,
    toggleWakeLock,
    requestWakeLock,
    releaseWakeLock,
  };
}
