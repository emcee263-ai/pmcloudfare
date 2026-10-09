import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/account/LoginForm';
import { SplitPage } from '@/components/ui/SplitPage';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };

export default function LoginPage() {
  return (
    <SplitPage title="Sign in" intro="See your orders and check out faster. You can also buy without an account.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </SplitPage>
  );
}
