import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/account/PasswordForms';
import { SplitPage } from '@/components/ui/SplitPage';

export const metadata: Metadata = { title: 'Forgot password', robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <SplitPage title="Forgot password" intro="Enter your email and we will send you a link to choose a new one.">
      <ForgotPasswordForm />
    </SplitPage>
  );
}
