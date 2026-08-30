import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { currentStaff } from '@/lib/auth';
import { StaffLoginForm } from '@/components/auth/LoginForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await currentStaff()) redirect('/admin');

  return (
    <div className="shell">
      <div className="auth-shell">
        <div className="auth-card">
          <p className="label">Operations</p>
          <h1>Staff sign in</h1>
          <p className="auth-card__lede">
            Registrations, allocations, on-site check-in and site content. Access depends on your
            role.
          </p>
          <StaffLoginForm />
        </div>
      </div>
    </div>
  );
}
