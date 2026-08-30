import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/auth/ResetForms';

export const metadata: Metadata = {
  title: 'Reset your password',
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="page auth-shell">
      <div className="auth-card">
        <h1>Reset password</h1>
        <p className="auth-card__lede">
          Enter the email you registered with and we will send a link to set a new password.
        </p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
