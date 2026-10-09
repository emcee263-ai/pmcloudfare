'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const KEY = 'pm-notice-seen';

/** A short notice, not a consent banner: the shop only uses cookies and storage it needs to work. */
export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch {
      // Storage blocked: show nothing rather than nag on every page.
    }
  }, []);

  if (!visible) return null;

  function dismiss() {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      // Ignore.
    }
    setVisible(false);
  }

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-xl flex-col gap-3 border border-white/20 bg-surface p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-mute">
        We only use cookies and storage the shop needs: your bag and sign-in. No ads, no tracking.{' '}
        <Link href="/cookies" className="text-white underline">Details</Link>
      </p>
      <button type="button" onClick={dismiss} className="btn h-10 shrink-0">
        Got it
      </button>
    </div>
  );
}
