'use client';

import { useEffect, useState } from 'react';

type Pref = 'system' | 'light' | 'dark';

const ORDER: Pref[] = ['system', 'light', 'dark'];
const LABEL: Record<Pref, string> = {
  system: 'Following your device',
  light: 'Light theme',
  dark: 'Dark theme',
};

declare global {
  interface Window {
    /** Set by the small script in the page head. Applies the saved theme choice. */
    __pmTheme?: () => void;
  }
}

function readPref(): Pref {
  const value = document.documentElement.getAttribute('data-theme-pref');
  return value === 'light' || value === 'dark' ? value : 'system';
}

/**
 * One button that cycles through: follow my device (default), light, dark.
 * "Follow my device" switches by itself when the phone or computer changes between light and dark.
 */
export function ThemeToggle() {
  const [pref, setPref] = useState<Pref>('system');

  useEffect(() => {
    setPref(readPref());
    // Re-apply once the page has loaded, so the browser bar colour is set too.
    window.__pmTheme?.();
  }, []);

  function next() {
    const following = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];
    try {
      if (following === 'system') localStorage.removeItem('pm-theme');
      else localStorage.setItem('pm-theme', following);
    } catch {
      // Storage blocked: the theme still changes for this visit.
    }
    if (window.__pmTheme) window.__pmTheme();
    else document.documentElement.setAttribute('data-theme', following === 'light' ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme-pref', following);
    setPref(following);
  }

  const upcoming = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];

  return (
    <button
      type="button"
      onClick={next}
      aria-label={`Theme: ${LABEL[pref]}. Press to change to ${LABEL[upcoming].toLowerCase()}.`}
      title={LABEL[pref]}
      className="grid h-10 w-10 place-items-center text-mute hover:text-white"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {pref === 'system' && (
          <>
            <rect x="3" y="4" width="18" height="12" rx="1.5" />
            <path d="M8 20h8M12 16v4" />
          </>
        )}
        {pref === 'light' && (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
          </>
        )}
        {pref === 'dark' && <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />}
      </svg>
    </button>
  );
}
