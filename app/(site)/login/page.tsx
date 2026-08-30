import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { currentDelegate } from '@/lib/auth';
import { DelegateLoginForm } from '@/components/auth/LoginForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Delegate sign in',
  description: 'Sign in to track your LUMEN MUN registration, allocation and documents.',
  robots: { index: false },
};

export default async function LoginPage() {
  if (await currentDelegate()) redirect('/dashboard');

  return (
    <div className="page auth-shell">
      <div className="auth-card">
        <h1>Sign in</h1>
        <p className="auth-card__lede">
          Use the email and password you set when you registered. Your seat status, allocation and
          committee documents live behind here.
        </p>
        <DelegateLoginForm />
      </div>
    </div>
  );
}
