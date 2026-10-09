import type { Metadata } from 'next';
import Link from 'next/link';
import { ResetPasswordForm } from '@/components/account/PasswordForms';
import { SplitPage } from '@/components/ui/SplitPage';

export const metadata: Metadata = {
  title: 'Choose a new password',
  robots: { index: false },
  referrer: 'no-referrer',
};

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  return (
    <SplitPage title="New password">
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="max-w-xl space-y-6">
          <p className="text-mute">This link is missing its code. Ask for a new one.</p>
          <Link href="/forgot-password" className="btn">Reset my password</Link>
        </div>
      )}
    </SplitPage>
  );
}
