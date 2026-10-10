'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

function safeNext(value: string | null) {
  // Only plain paths on this site. Slashes and backslashes at the start could point to another site.
  return value && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') ? value : null;
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const body =
      mode === 'login'
        ? { email: form.get('email'), password: form.get('password') }
        : { full_name: form.get('full_name'), email: form.get('email'), password: form.get('password') };

    try {
      const res = await fetch(mode === 'login' ? '/api/auth/login' : '/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; role?: string };
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Try again.');
        setBusy(false);
        return;
      }
      const next = safeNext(params.get('next')) ?? (data.role === 'admin' ? '/admin' : '/account');
      router.push(next);
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full space-y-5">
      <div className="flex gap-2">
        {(['login', 'signup'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            aria-pressed={mode === m}
            className={`h-10 px-4 text-sm ${mode === m ? 'bg-white text-black' : 'bg-surface text-mute hover:text-white'}`}
          >
            {m === 'login' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      {mode === 'signup' && (
        <div>
          <label htmlFor="full_name" className="field-label">Full name</label>
          <input id="full_name" name="full_name" required autoComplete="name" className="field" />
        </div>
      )}
      <div>
        <label htmlFor="email" className="field-label">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field" />
      </div>
      <div>
        <label htmlFor="password" className="field-label">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={mode === 'signup' ? 8 : undefined}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          className="field"
        />
        {mode === 'signup' && <p className="mt-2 text-xs text-mute">At least 8 characters.</p>}
        {mode === 'login' && (
          <Link href="/forgot-password" className="mt-2 inline-block text-xs text-mute hover:text-white">
            Forgot your password?
          </Link>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-white">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn w-full">
        {busy ? 'One moment...' : mode === 'login' ? 'Sign in' : 'Create account'}
      </button>
    </form>
  );
}
