'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';

/** Only allow same-site relative redirects. */
function safeNext(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/account';
}

export function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isSupabaseConfigured) {
    return (
      <p className="max-w-md text-mute">
        Accounts need a Supabase project. Add your keys to <code>.env.local</code> and restart the dev server.
      </p>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const supabase = createClient();

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
        setBusy(false);
        return;
      }
      router.push(next);
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/account`,
      },
    });
    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }
    if (data.session) {
      router.push(next);
      router.refresh();
    } else {
      setMessage('Check your email to confirm your account, then sign in.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm space-y-4">
      {mode === 'signup' && (
        <div>
          <label htmlFor="name" className="field-label">Full name</label>
          <input id="name" className="field" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      )}
      <div>
        <label htmlFor="email" className="field-label">Email</label>
        <input id="email" type="email" className="field" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label htmlFor="password" className="field-label">Password</label>
        <input
          id="password"
          type="password"
          className="field"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {message && (
        <p role="alert" className="bg-surface p-3 text-sm">
          {message}
        </p>
      )}

      <button type="submit" className="btn w-full" disabled={busy}>
        {busy ? 'One moment' : mode === 'signin' ? 'Sign in' : 'Create account'}
      </button>

      <button
        type="button"
        className="text-sm text-mute hover:text-white"
        onClick={() => {
          setMode(mode === 'signin' ? 'signup' : 'signin');
          setMessage(null);
        }}
      >
        {mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}
      </button>
    </form>
  );
}
