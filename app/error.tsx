'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Last-resort error boundary. It never shows the underlying message — a
 * database error can carry connection details — only the digest, which is
 * enough to find the matching line in the server logs.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[unhandled]', error);
  }, [error]);

  return (
    <div className="shell">
      <main className="page">
        <div className="page-head" style={{ paddingTop: 140 }}>
          <h1 className="h1">Something went wrong</h1>
          <p className="lede page-head__lede">
            This page could not be loaded. The team has the details; try again, and if it keeps
            happening, tell Delegate Affairs what you were doing.
          </p>

          {error.digest && (
            <p className="readout stack-20">REFERENCE · {error.digest}</p>
          )}

          <div className="row-actions stack-36">
            <button className="btn btn--primary" type="button" onClick={reset}>
              Try again
            </button>
            <Link className="btn btn--ghost btn--sm" href="/">
              Back to the conference
            </Link>
            <Link className="btn btn--ghost btn--sm" href="/contact">
              Contact us
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
