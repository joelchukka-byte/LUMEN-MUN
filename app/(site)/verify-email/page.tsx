import type { Metadata } from 'next';
import Link from 'next/link';
import { verifyEmail } from '@/lib/actions/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Confirm your email',
  robots: { index: false },
};

type Props = { searchParams: Promise<{ token?: string }> };

const COPY = {
  ok: {
    mark: '✓',
    tone: 'success' as const,
    title: 'Email confirmed',
    body: 'Your delegate account is active. Everything about your seat lives on your dashboard.',
  },
  already: {
    mark: '✓',
    tone: 'info' as const,
    title: 'Already confirmed',
    body: 'This address was confirmed earlier. Nothing more to do.',
  },
  invalid: {
    mark: '!',
    tone: 'error' as const,
    title: 'That link did not work',
    body: 'The confirmation link is invalid or has already been used. Sign in and request a new one from your dashboard.',
  },
};

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const result = await verifyEmail(token ?? '');
  const copy = COPY[result];

  return (
    <div className="page auth-shell">
      <div className="auth-card">
        <h1>{copy.title}</h1>

        <div className="alert" data-tone={copy.tone} role="status">
          <span className="alert__mark" aria-hidden="true">{copy.mark}</span>
          <span>{copy.body}</span>
        </div>

        <p className="auth-switch">
          <Link className="btn btn--primary btn--sm" href="/dashboard">
            Go to your dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
