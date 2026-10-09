'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    router.push('/');
    router.refresh();
  }

  return (
    <button type="button" onClick={signOut} disabled={busy} className="btn-outline">
      {busy ? 'Signing out...' : 'Sign out'}
    </button>
  );
}
