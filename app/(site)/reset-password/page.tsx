import type { Metadata } from 'next';
import Link from 'next/link';
import { ResetPasswordForm } from '@/components/auth/ResetForms';

export const metadata: Metadata = {
  title: 'Set a new password',
  robots: { index: false },
};

type Props = { searchParams: Promise<{ token?: string }> };

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  return (
    <div className="page auth-shell">
      <div className="auth-card">
        <h1>New password</h1>

        {token ? (
          <>
            <p className="auth-card__lede">Choose a password you have not used elsewhere.</p>
            <ResetPasswordForm token={token} />
          </>
        ) : (
          <>
            <div className="alert" data-tone="error">
              <span className="alert__mark" aria-hidden="true">!</span>
              <span>This link is missing its reset token. Request a new one.</span>
            </div>
            <p className="auth-switch">
              <Link href="/forgot-password">Request a reset link</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
