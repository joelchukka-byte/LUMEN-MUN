'use client';

import { useState, useTransition } from 'react';
import { allocate, setAllocationLock, type ActionResult } from '@/lib/actions/admin';

export type AllocRow = {
  ref: string;
  name: string;
  school: string;
  experience: string | null;
  choices: string[];
  assignedCommittee: string | null;
  assignedCountry: string | null;
  locked: boolean;
};

type Committee = { slug: string; name: string; seats: number };

/**
 * Allocation desk.
 *
 * Preferences are shown in order so a chair can honour them at a glance, and
 * the seat counter beside each committee updates as you assign — the point is
 * to see over-subscription before it happens, not after.
 */
export function AllocationRows({
  rows,
  committees,
  canLock,
}: {
  rows: AllocRow[];
  committees: Committee[];
  canLock: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [draft, setDraft] = useState<Record<string, { committee: string; country: string }>>({});

  const value = (row: AllocRow) =>
    draft[row.ref] ?? {
      committee: row.assignedCommittee ?? '',
      country: row.assignedCountry ?? '',
    };

  const counts = committees.map((c) => ({
    ...c,
    taken: rows.filter((r) => (draft[r.ref]?.committee ?? r.assignedCommittee) === c.slug).length,
  }));

  function save(row: AllocRow) {
    const v = value(row);
    startTransition(async () => {
      setResult(await allocate(row.ref, v.committee, v.country));
    });
  }

  return (
    <>
      <div className="metric-row" style={{ marginBottom: 22 }}>
        {counts.map((c) => (
          <div className="metric" key={c.slug}>
            <p className="metric__label">{c.name.toUpperCase()}</p>
            <p className={`metric__value${c.seats && c.taken > c.seats ? ' metric__value--flare' : ''}`}>
              {c.taken}
              {c.seats > 0 && <span style={{ fontSize: 15, color: 'var(--text-72)' }}> / {c.seats}</span>}
            </p>
            <p className="metric__note">
              {c.seats > 0 && c.taken > c.seats ? 'OVER CAPACITY' : 'ALLOCATED'}
            </p>
          </div>
        ))}
      </div>

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
              <th>PREFERENCES</th>
              <th>EXPERIENCE</th>
              <th>COMMITTEE</th>
              <th>PORTFOLIO</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const v = value(row);
              const dirty =
                v.committee !== (row.assignedCommittee ?? '') ||
                v.country !== (row.assignedCountry ?? '');

              return (
                <tr key={row.ref}>
                  <td className="mono">{row.ref}</td>
                  <td>
                    {row.name}
                    <br />
                    <span style={{ color: 'var(--text-72)', fontSize: 12 }}>{row.school}</span>
                  </td>
                  <td className="mono" style={{ fontSize: 11 }}>
                    {row.choices.map((c, i) => (
                      <div key={i}>
                        {i + 1}. {committees.find((x) => x.slug === c)?.name ?? c}
                      </div>
                    ))}
                  </td>
                  <td style={{ fontSize: 12 }}>{row.experience ?? '-'}</td>
                  <td>
                    <select
                      className="select"
                      style={{ marginTop: 0, minWidth: 190 }}
                      value={v.committee}
                      disabled={row.locked && !canLock}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, [row.ref]: { ...v, committee: e.target.value } }))
                      }
                    >
                      <option value="">Unallocated</option>
                      {committees.map((c) => (
                        <option value={c.slug} key={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="input"
                      style={{ marginTop: 0, minWidth: 150 }}
                      value={v.country}
                      placeholder="Country / portfolio"
                      disabled={row.locked && !canLock}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, [row.ref]: { ...v, country: e.target.value } }))
                      }
                    />
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn-mini"
                        data-tone="approve"
                        disabled={pending || !dirty}
                        onClick={() => save(row)}
                      >
                        {dirty ? 'Save' : 'Saved'}
                      </button>

                      {canLock && (
                        <button
                          className="btn-mini"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              setResult(await setAllocationLock(row.ref, !row.locked));
                            })
                          }
                        >
                          {row.locked ? 'Unlock' : 'Lock'}
                        </button>
                      )}

                      {row.locked && !canLock && (
                        <span className="pill" data-tone="locked">
                          Locked
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <div className="empty-state">
          <p className="empty-state__mark">[ ]</p>
          <p>No confirmed delegates to allocate yet.</p>
        </div>
      )}
    </>
  );
}
