import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/account/LoginForm';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };

export default function LoginPage() {
  return (
    <section className="shell py-10 sm:py-16">
      <h1 className="mb-10 font-display text-5xl font-extrabold tracking-tight sm:text-7xl">Sign in</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
    </section>
  );
}
