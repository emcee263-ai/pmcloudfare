'use client';

import { useEffect, useRef } from 'react';
import { PMLogo } from '@/components/ui/PMLogo';

/**
 * Full-screen intro for the home page: the PM logo builds itself on a blank screen, then the cover slides away
 * to show the shop. It plays once per browser session (a tap skips it).
 *
 * The animation and the exit are plain CSS (see globals.css), so the cover always leaves, even if scripts fail.
 * The page behind it is ordinary page content that search engines and screen readers read as usual.
 */
export function Splash() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem('pm-splash', '1');
    } catch {
      // Storage blocked: the intro may play again on the next visit to the home page.
    }
    const el = ref.current;
    if (!el) return;

    const skip = () => el.setAttribute('data-leaving', '');
    el.addEventListener('click', skip);
    el.addEventListener('touchstart', skip, { passive: true });
    const onKey = () => skip();
    window.addEventListener('keydown', onKey);
    // Switch the cover off once it has slid away, so it can never sit in front of anything.
    // (It is hidden rather than removed, because React still owns this element.)
    // Also note that the intro has played, so going to another page and back to Home does not replay it.
    const onEnd = (e: AnimationEvent) => {
      if (!e.animationName.startsWith('pm-cover')) return;
      el.style.display = 'none';
      document.documentElement.setAttribute('data-splash', 'seen');
    };
    el.addEventListener('animationend', onEnd);

    return () => {
      el.removeEventListener('click', skip);
      el.removeEventListener('touchstart', skip);
      window.removeEventListener('keydown', onKey);
      el.removeEventListener('animationend', onEnd);
    };
  }, []);

  return (
    <div ref={ref} className="pm-splash" aria-hidden="true">
      <PMLogo animated />
      <span className="pm-splash-name">PEACEMAGENTS</span>
    </div>
  );
}
