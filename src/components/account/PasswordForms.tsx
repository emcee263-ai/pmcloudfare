'use client';

import Link from 'next/link';
import { useState } from 'react';

async function post(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => null);
  if (!res) return { ok: false, error: 'Could not reach the server. Check your connection and try again.' };
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return { ok: res.ok, error: data.error ?? 'Something went wrong. Try again.' };
}

export function ForgotPasswordForm() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const email = String(new FormData(e.currentTarget).get('email') ?? '');
    const result = await post('/api/auth/forgot', { email });
    setBusy(false);
    if (result.ok) setSent(true);
    else setError(result.error);
  }

  if (sent) {
    return (
      <p className="max-w-xl text-mute" role="status">
        If an account exists for that email, we have sent a link to choose a new password. It works for one hour. Check
        your spam folder if it does not arrive.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-xl space-y-5">
      <div>
        <label htmlFor="email" className="field-label">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field" />
      </div>
      {error && <p role="alert" className="text-sm">{error}</p>}
      <button type="submit" disabled={busy} className="btn w-full">{busy ? 'Sending...' : 'Send reset link'}</button>
      <Link href="/login" className="block text-sm text-mute hover:text-white">Back to sign in</Link>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get('password') ?? '');
    if (password !== String(form.get('confirm') ?? '')) {
      setError('The two passwords do not match.');
      return;
    }
    setBusy(true);
    setError(null);
    const result = await post('/api/auth/reset', { token, password });
    setBusy(false);
    if (result.ok) setDone(true);
    else setError(result.error);
  }

  if (done) {
    return (
      <div className="max-w-xl space-y-6" role="status">
        <p className="text-mute">Your password has been changed. Sign in with the new one.</p>
        <Link href="/login" className="btn">Sign in</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-xl space-y-5">
      <div>
        <label htmlFor="password" className="field-label">New password</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="field" />
        <p className="mt-2 text-xs text-mute">At least 8 characters.</p>
      </div>
      <div>
        <label htmlFor="confirm" className="field-label">Repeat new password</label>
        <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="field" />
      </div>
      {error && <p role="alert" className="text-sm">{error}</p>}
      <button type="submit" disabled={busy} className="btn w-full">{busy ? 'Saving...' : 'Change password'}</button>
    </form>
  );
}
