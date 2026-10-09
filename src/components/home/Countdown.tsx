'use client';

import { useEffect, useState } from 'react';
import { pad } from '@/lib/utils';

export function Countdown({ target }: { target: string }) {
  // null until mounted, so server and client render the same markup.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) return <p className="h-6" aria-hidden="true" />;

  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return <p className="font-semibold">Live now</p>;

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);

  return (
    <p className="tabular-nums">
      <span className="text-mute">Opens in </span>
      <span className="font-semibold">
        {days}d {pad(hours)}h {pad(minutes)}m {pad(seconds)}s
      </span>
    </p>
  );
}
