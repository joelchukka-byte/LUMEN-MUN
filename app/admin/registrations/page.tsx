import Link from 'next/link';
import { desc, eq, or, ilike, and, type SQL } from 'drizzle-orm';
import { db, registrations } from '@/db';
import { requireStaffPage } from '@/lib/auth';
import { RegistrationRows, type Row } from '@/components/admin/RegistrationRows';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Registrations' };

const FILTERS = [
  ['', 'All'],
  ['pending_review', 'Awaiting review'],
  ['submitted', 'Unpaid'],
  ['approved', 'Confirmed'],
  ['rejected', 'Sent back'],
  ['waitlisted', 'Waitlisted'],
] as const;

type Props = { searchParams: Promise<{ status?: string; q?: string }> };

export default async function RegistrationsPage({ searchParams }: Props) {
  await requireStaffPage('admin');
  const { status = '', q = '' } = await searchParams;

  const clauses: SQL[] = [];
  if (status) clauses.push(eq(registrations.status, status as never));
  if (q.trim()) {
    const like = `%${q.trim()}%`;
    clauses.push(
      or(
        ilike(registrations.name, like),
        ilike(registrations.email, like),
        ilike(registrations.ref, like),
        ilike(registrations.school, like)
      )!
    );
  }

  const rows = await db
    .select()
    .from(registrations)
    .where(clauses.length ? and(...clauses) : undefined)
    .orderBy(desc(registrations.createdAt))
    .limit(300);

  const data: Row[] = rows.map((r) => ({
    ref: r.ref,
    name: r.name,
    email: r.email,
    school: r.school,
    grade: r.grade,
    committee1: r.committee1,
    status: r.status,
    fee: r.fee,
    payMethod: r.payMethod,
    upiTxnId: r.upiTxnId,
    proofFile: r.proofFile,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <>
      <div className="console__head">
        <div>
          <p className="label">Registrations</p>
          <h1 className="console__title">
            {rows.length} {status ? FILTERS.find((f) => f[0] === status)?.[1].toLowerCase() : 'registrations'}
          </h1>
        </div>
        <a className="btn-mini" href={`/api/export/registrations${status ? `?status=${status}` : ''}`}>
          Export CSV
        </a>
      </div>

      <form className="toolbar" action="/admin/registrations">
        {status && <input type="hidden" name="status" value={status} />}
        <input
          className="input"
          name="q"
          defaultValue={q}
          placeholder="Search name, email, reference or school"
        />
        <button className="btn-mini" type="submit">
          Search
        </button>

        <span className="toolbar__spacer" />

        {FILTERS.map(([value, label]) => (
          <Link
            className="btn-mini"
            key={value || 'all'}
            href={`/admin/registrations${value ? `?status=${value}` : ''}`}
            style={
              status === value
                ? { borderColor: 'var(--gold)', color: 'var(--gold)' }
                : undefined
            }
          >
            {label}
          </Link>
        ))}
      </form>

      <RegistrationRows rows={data} />
    </>
  );
}
