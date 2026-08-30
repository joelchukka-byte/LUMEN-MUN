'use client';

import { useState, useTransition } from 'react';
import { approvePayment, rejectPayment, type ActionResult } from '@/lib/actions/admin';
import { rupees, formatDateTime, STATUS_LABEL } from '@/lib/format';
import type { RegistrationStatus } from '@/db';

export type Row = {
  ref: string;
  name: string;
  email: string;
  school: string;
  grade: string;
  committee1: string;
  status: RegistrationStatus;
  fee: number;
  payMethod: string | null;
  upiTxnId: string | null;
  proofFile: string | null;
  createdAt: string;
};

/**
 * The review queue.
 *
 * Approving is one click; rejecting demands a reason, because the delegate
 * sees it and has to act on it — an unexplained rejection just produces an
 * email to Delegate Affairs asking why.
 */
export function RegistrationRows({ rows }: { rows: Row[] }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [busyRef, setBusyRef] = useState<string | null>(null);

  function run(ref: string, fn: () => Promise<ActionResult>) {
    setBusyRef(ref);
    startTransition(async () => {
      const outcome = await fn();
      setResult(outcome);
      setBusyRef(null);
      if (outcome.ok) {
        setRejecting(null);
        setReason('');
      }
    });
  }

  return (
    <>
      {result && (
        <div
          className="alert"
          data-tone={result.ok ? 'success' : 'error'}
          role="status"
          style={{ marginBottom: 18 }}
        >
          <span className="alert__mark" aria-hidden="true">{result.ok ? '✓' : '!'}</span>
          <span>{result.message}</span>
        </div>
      )}

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>REF</th>
              <th>DELEGATE</th>
              <th>SCHOOL</th>
              <th>1ST CHOICE</th>
              <th>PROOF</th>
              <th className="num">FEE</th>
              <th>STATUS</th>
              <th>REGISTERED</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.ref} style={busyRef === row.ref ? { opacity: 0.5 } : undefined}>
                <td className="mono">{row.ref}</td>
                <td>
                  {row.name}
                  <br />
                  <span style={{ color: 'var(--text-72)', fontSize: 12 }}>{row.email}</span>
                </td>
                <td>
                  {row.school}
                  <br />
                  <span style={{ color: 'var(--text-72)', fontSize: 12 }}>{row.grade}</span>
                </td>
                <td>{row.committee1}</td>
                <td className="mono">
                  {row.payMethod === 'screenshot' && row.proofFile ? (
                    <a href={`/api/proof/${encodeURIComponent(row.proofFile)}`} target="_blank" rel="noopener">
                      View file →
                    </a>
                  ) : row.upiTxnId ? (
                    row.upiTxnId
                  ) : (
                    '-'
                  )}
                </td>
                <td className="num">{rupees(row.fee)}</td>
                <td>
                  <span className="pill" data-tone={row.status}>
                    {STATUS_LABEL[row.status]}
                  </span>
                </td>
                <td className="mono">{formatDateTime(row.createdAt)}</td>
                <td>
                  <div className="row-actions">
                    <button
                      className="btn-mini"
                      data-tone="approve"
                      disabled={pending || row.status === 'approved'}
                      onClick={() => run(row.ref, () => approvePayment(row.ref))}
                    >
                      Approve
                    </button>
                    <button
                      className="btn-mini"
                      data-tone="reject"
                      disabled={pending}
                      onClick={() => {
                        setRejecting(rejecting === row.ref ? null : row.ref);
                        setReason('');
                      }}
                    >
                      Reject
                    </button>
                  </div>

                  {rejecting === row.ref && (
                    <div style={{ marginTop: 12, minWidth: 240 }}>
                      <label className="field">
                        <span className="field__label">Reason (the delegate sees this)</span>
                        <input
                          className="input"
                          value={reason}
                          autoFocus
                          placeholder="e.g. Screenshot is unreadable"
                          onChange={(e) => setReason(e.target.value)}
                        />
                      </label>
                      <div className="row-actions" style={{ marginTop: 10 }}>
                        <button
                          className="btn-mini"
                          data-tone="reject"
                          disabled={pending || reason.trim().length < 4}
                          onClick={() => run(row.ref, () => rejectPayment(row.ref, reason))}
                        >
                          Send back
                        </button>
                        <button className="btn-mini" onClick={() => setRejecting(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <div className="empty-state">
          <p className="empty-state__mark">[ ]</p>
          <p>Nothing matches this filter.</p>
        </div>
      )}
    </>
  );
}
