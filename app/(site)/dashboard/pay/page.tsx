import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentDelegate } from '@/lib/auth';
import { PaymentPanel } from '@/components/register/PaymentPanel';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pay and confirm',
  robots: { index: false },
};

export default async function DashboardPayPage() {
  const delegate = await currentDelegate();
  if (!delegate) redirect('/login');
  if (delegate.status === 'approved') redirect('/dashboard');

  return (
    <div className="page">
      <div className="page-head">
        <p className="label label--accent">
          <Link href="/dashboard" style={{ color: 'inherit' }}>
            / DASHBOARD
          </Link>{' '}
          / PAYMENT
        </p>
        <h1 className="h1">Confirm your seat</h1>
        {delegate.status === 'rejected' && delegate.reviewNote && (
          <div className="alert stack-26" data-tone="error">
            <span className="alert__mark" aria-hidden="true">!</span>
            <span>
              <b>Previous proof was not accepted.</b> {delegate.reviewNote}
            </span>
          </div>
        )}
      </div>

      <div className="page-body">
        <PaymentPanel
          reference={delegate.ref}
          fee={delegate.fee}
          upiConfigured={!!process.env.UPI_ID}
        />
      </div>
    </div>
  );
}
