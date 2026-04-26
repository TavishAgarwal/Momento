import { useState, useEffect } from 'react';

export function useCountdown(expiresAt: number) {
  const [remaining, setRemaining] = useState(() => Math.max(0, expiresAt - Date.now()));
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.max(0, expiresAt - Date.now());
      setRemaining(diff);
      if (diff === 0) {
        setIsExpired(true);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const formatted = `${minutes}:${String(seconds).padStart(2, '0')}`;
  const progress = expiresAt > 0 ? remaining / (expiresAt - Date.now() + remaining) : 0;

  return { remaining, isExpired, minutes, seconds, formatted, progress };
}
