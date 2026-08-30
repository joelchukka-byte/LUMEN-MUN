'use client';

import { useState, useTransition } from 'react';
import { setStaffActive, revokeAllSessions, type ActionResult } from '@/lib/actions/admin';
import type { AdminRole } from '@/db';

export type AccountRow = {
  id: number;
  username: string;
  displayName: string | null;
  role: AdminRole;
  active: boolean;
  createdBy: string | null;
  lastLoginAt: string | null;
  liveSessions: number;
};

const ROLE_NOTE: Record<AdminRole, string> = {
  oc: 'Check-in and kits',
  admin: 'Registrations, payments, allocations',
  superadmin: 'Everything, including content and accounts',
};

export function AccountRows({ rows }: { rows: AccountRow[] }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  function run(fn: () => Promise<ActionResult>) {
    startTransition(async () => setResult(await fn()));
  }

  if (!rows.length) {
    return (
      <div className="empty-state" style={{ marginBottom: 24 }}>
        <p className="empty-state__mark">[ ]</p>
        <p>No named accounts yet: create one below so people are not sharing the owner login.</p>
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

      <div className="table-wrap" style={{ marginBottom: 30 }}>
        <table className="data">
          <thead>
            <tr>
              <th>USERNAME</th>
              <th>NAME</th>
              <th>ROLE</th>
              <th>LAST SIGN-IN</th>
              <th>LIVE SESSIONS</th>
              <th>STATE</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="mono">{row.username}</td>
                <td>{row.displayName ?? '-'}</td>
                <td>
                  {row.role.toUpperCase()}
                  <br />
                  <span style={{ color: 'var(--text-72)', fontSize: 12 }}>{ROLE_NOTE[row.role]}</span>
                </td>
                <td className="mono">{row.lastLoginAt ?? 'Never'}</td>
                <td className="num">{row.liveSessions}</td>
                <td>
                  <span className="pill" data-tone={row.active ? 'approved' : 'cancelled'}>
                    {row.active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      className="btn-mini"
                      data-tone={row.active ? 'reject' : 'approve'}
                      disabled={pending}
                      onClick={() => run(() => setStaffActive(row.id, !row.active))}
                    >
                      {row.active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      className="btn-mini"
                      disabled={pending || row.liveSessions === 0}
                      onClick={() => run(() => revokeAllSessions(row.username))}
                    >
                      Sign out everywhere
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
