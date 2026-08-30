import { desc } from 'drizzle-orm';
import { db, schoolDelegations } from '@/db';
import { requireStaffPage } from '@/lib/auth';
import { DelegationRows } from '@/components/admin/DelegationRows';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'School delegations' };

export default async function DelegationsPage() {
  await requireStaffPage('admin');

  const rows = await db
    .select()
    .from(schoolDelegations)
    .orderBy(desc(schoolDelegations.createdAt))
    .limit(200);

  const pending = rows.filter((r) => r.status === 'submitted').length;

  return (
    <>
      <div className="console__head">
        <div>
          <p className="label">School delegations</p>
          <h1 className="console__title">
            {rows.length} {rows.length === 1 ? 'delegation' : 'delegations'}
          </h1>
        </div>
        <span className="readout">{pending} AWAITING REVIEW</span>
      </div>

      <div className="alert" data-tone="info" style={{ marginBottom: 22 }}>
        <span className="alert__mark" aria-hidden="true">i</span>
        <span>
          Delegations are invoiced against a final headcount rather than paying online. Approve one
          once Finance has issued and reconciled its invoice: the individual delegates still
          register separately and quote the delegation reference.
        </span>
      </div>

      <DelegationRows
        rows={rows.map((r) => ({
          ref: r.ref,
          institution: r.institution,
          coordinatorName: r.coordinatorName,
          email: r.email,
          phone: r.phone,
          sizeBand: r.sizeBand,
          accommodation: r.accommodation,
          committeeSpread: r.committeeSpread,
          invoicingNotes: r.invoicingNotes,
          feeQuoted: r.feeQuoted,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </>
  );
}
