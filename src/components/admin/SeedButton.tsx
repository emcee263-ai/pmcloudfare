'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SeedButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function seed() {
    setBusy(true);
    setError(null);
    const res = await fetch('/api/admin/seed', { method: 'POST' }).catch(() => null);
    if (res && res.ok) {
      router.refresh();
      return;
    }
    const data = res ? ((await res.json().catch(() => ({}))) as { error?: string }) : {};
    setError(data.error ?? 'Could not load the sample products.');
    setBusy(false);
  }

  return (
    <div>
      <button type="button" onClick={seed} disabled={busy} className="btn-outline">
        {busy ? 'Loading...' : 'Load sample products'}
      </button>
      {error && <p role="alert" className="mt-3 text-sm">{error}</p>}
    </div>
  );
}
