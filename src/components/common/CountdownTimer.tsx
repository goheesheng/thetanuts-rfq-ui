'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  deadline: number; // Unix timestamp in seconds
  onExpire?: () => void;
  className?: string;
}

export default function CountdownTimer({ deadline, onExpire, className }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(() => Math.max(0, deadline - Math.floor(Date.now() / 1000)));

  useEffect(() => {
    const id = setInterval(() => {
      const r = Math.max(0, deadline - Math.floor(Date.now() / 1000));
      setRemaining(r);
      if (r === 0) {
        onExpire?.();
        clearInterval(id);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [deadline, onExpire]);

  if (remaining <= 0) return <span className={className}>expired</span>;

  const hours = Math.floor(remaining / 3600);
  const mins = Math.floor((remaining % 3600) / 60);
  const secs = remaining % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || hours > 0) parts.push(`${mins}m`);
  parts.push(`${secs}s`);

  return <span className={className}>{parts.join(' ')}</span>;
}
