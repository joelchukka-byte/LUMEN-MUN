'use client';

import { Fragment, useState, useTransition } from 'react';
import { setDelegationStatus, type ActionResult } from '@/lib/actions/admin';
import { rupees, formatDateTime, STATUS_LABEL } from '@/lib/format';
import type { RegistrationStatus } from '@/db';

export type DelegationRow = {
  ref: string;
  institution: string;
  coordinatorName: string;
  email: string;
  phone: string;
  sizeBand: string;
  accommodation: string;
  committeeSpread: string | null;
  invoicingNotes: string | null;
  feeQuoted: number;
  status: RegistrationStatus;
  createdAt: string;
};

const STAY: Record<string, string> = {
  none: 'Not required',
  partial: 'Part of delegation',
  full: 'Full delegation',
};

export function DelegationRows({ rows }: { rows: DelegationRow[] }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  function set(ref: string, status: string) {
    startTransition(async () => {
      setResult(await setDelegationStatus(ref, status));
      setConfirming(null);
    });
  }

  if (!rows.length) {
    return (
      <div className="empty-state">
        <p className="empty-state__mark">[ ]</p>
        <p>No school delegations yet.</p>
      </div>
    );
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
              <th>INSTITUTION</th>
              <th>COORDINATOR</th>
              <th>SIZE</th>
              <th>STAY</th>
              <th className="num">QUOTED</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Fragment key={row.ref}>
                <tr>
                  <td className="mono">{row.ref}</td>
                  <td>{row.institution}</td>
                  <td>
                    {row.coordinatorName}
                    <br />
                    <span style={{ color: 'var(--text-72)', fontSize: 12 }}>{row.email}</span>
                  </td>
                  <td>{row.sizeBand}</td>
                  <td style={{ fontSize: 12 }}>{STAY[row.accommodation] ?? row.accommodation}</td>
                  <td className="num">{rupees(row.feeQuoted)}</td>
                  <td>
                    <span className="pill" data-tone={row.status}>
                      {STATUS_LABEL[row.status]}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn-mini"
                        data-tone="approve"
                        disabled={pending || row.status === 'approved'}
                        onClick={() => set(row.ref, 'approved')}
                      >
                        Approve
                      </button>
                      {/* Cancelling a delegation emails nobody and cannot be
                          undone from here, so it asks first. */}
                      {confirming === row.ref ? (
                        <>
                          <button
                            className="btn-mini"
                            data-tone="reject"
                            disabled={pending}
                            onClick={() => set(row.ref, 'cancelled')}
                          >
                            Confirm cancel
                          </button>
                          <button className="btn-mini" onClick={() => setConfirming(null)}>
                            Keep
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn-mini"
                          data-tone="reject"
                          disabled={pending || row.status === 'cancelled'}
                          onClick={() => setConfirming(row.ref)}
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        className="btn-mini"
                        onClick={() => setExpanded(expanded === row.ref ? null : row.ref)}
                        aria-expanded={expanded === row.ref}
                      >
                        {expanded === row.ref ? 'Hide' : 'Detail'}
                      </button>
                    </div>
                  </td>
                </tr>

                {expanded === row.ref && (
                  <tr>
                    <td colSpan={8} style={{ background: 'rgba(0,0,0,0.24)' }}>
                      <dl className="kv" style={{ maxWidth: 720 }}>
                        <dt>PHONE</dt>
                        <dd>{row.phone}</dd>
                        <dt>SPREAD</dt>
                        <dd>{row.committeeSpread || '-'}</dd>
                        <dt>INVOICING</dt>
                        <dd>{row.invoicingNotes || '-'}</dd>
                        <dt>REGISTERED</dt>
                        <dd>{formatDateTime(row.createdAt)}</dd>
                      </dl>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
