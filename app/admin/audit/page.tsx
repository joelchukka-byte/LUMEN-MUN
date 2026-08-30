import Link from 'next/link';
import { desc, ilike, or, and, type SQL } from 'drizzle-orm';
import { db, auditLog } from '@/db';
import { requireStaffPage } from '@/lib/auth';
import { formatDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Audit log' };

const PAGE_SIZE = 100;

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

export default async function AuditPage({ searchParams }: Props) {
  await requireStaffPage('superadmin');
  const { q = '', page = '1' } = await searchParams;

  const pageNum = Math.max(1, Number(page) || 1);

  const clauses: SQL[] = [];
  if (q.trim()) {
    const like = `%${q.trim()}%`;
    clauses.push(
      or(
        ilike(auditLog.actor, like),
        ilike(auditLog.action, like),
        ilike(auditLog.target, like),
        ilike(auditLog.detail, like)
      )!
    );
  }

  const rows = await db
    .select()
    .from(auditLog)
    .where(clauses.length ? and(...clauses) : undefined)
    .orderBy(desc(auditLog.createdAt))
    .limit(PAGE_SIZE + 1)
    .offset((pageNum - 1) * PAGE_SIZE);

  const hasMore = rows.length > PAGE_SIZE;
  const visible = rows.slice(0, PAGE_SIZE);

  return (
    <>
      <div className="console__head">
        <div>
          <p className="label">Governance</p>
          <h1 className="console__title">Audit log</h1>
        </div>
        <span className="readout">APPEND-ONLY · PAGE {pageNum}</span>
      </div>

      <form className="toolbar" action="/admin/audit">
        <input
          className="input"
          name="q"
          defaultValue={q}
          placeholder="Filter by person, action, reference or detail"
        />
        <button className="btn-mini" type="submit">
          Filter
        </button>
        {q && (
          <Link className="btn-mini" href="/admin/audit">
            Clear
          </Link>
        )}
      </form>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>WHEN</th>
              <th>WHO</th>
              <th>ROLE</th>
              <th>ACTION</th>
              <th>TARGET</th>
              <th>DETAIL</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id}>
                <td className="mono">{formatDateTime(row.createdAt)}</td>
                <td>{row.actor}</td>
                <td className="mono">{row.role ?? '-'}</td>
                <td className="mono">{row.action}</td>
                <td className="mono">{row.target ?? '-'}</td>
                <td>{row.detail ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {visible.length === 0 && (
        <div className="empty-state">
          <p className="empty-state__mark">[ ]</p>
          <p>Nothing recorded yet{q ? ' for that filter' : ''}.</p>
        </div>
      )}

      {(hasMore || pageNum > 1) && (
        <div className="row-actions" style={{ marginTop: 20 }}>
          {pageNum > 1 && (
            <Link
              className="btn-mini"
              href={`/admin/audit?page=${pageNum - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
            >
              ← Newer
            </Link>
          )}
          {hasMore && (
            <Link
              className="btn-mini"
              href={`/admin/audit?page=${pageNum + 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
            >
              Older →
            </Link>
          )}
        </div>
      )}
    </>
  );
}
