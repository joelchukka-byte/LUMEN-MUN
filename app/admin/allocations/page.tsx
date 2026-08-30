import { asc, inArray } from 'drizzle-orm';
import { db, registrations } from '@/db';
import { requireStaffPage, atLeast } from '@/lib/auth';
import { getCommittees } from '@/lib/content';
import { AllocationRows, type AllocRow } from '@/components/admin/AllocationRows';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Allocations' };

export default async function AllocationsPage() {
  const staff = await requireStaffPage('admin');

  const [committees, rows] = await Promise.all([
    getCommittees(),
    db
      .select()
      .from(registrations)
      // Only confirmed seats are worth allocating — an unpaid delegate may
      // never show up, and holding a portfolio for them blocks someone real.
      .where(inArray(registrations.status, ['approved']))
      .orderBy(asc(registrations.createdAt))
      .limit(500),
  ]);

  const data: AllocRow[] = rows.map((r) => ({
    ref: r.ref,
    name: r.name,
    school: r.school,
    experience: r.experience,
    choices: [r.committee1, r.committee2, r.committee3].filter(Boolean) as string[],
    assignedCommittee: r.assignedCommittee,
    assignedCountry: r.assignedCountry,
    locked: r.allocationLocked,
  }));

  const unallocated = data.filter((d) => !d.assignedCommittee).length;

  return (
    <>
      <div className="console__head">
        <div>
          <p className="label">Allocations</p>
          <h1 className="console__title">
            {unallocated} of {data.length} still to place
          </h1>
        </div>
      </div>

      {data.length > 0 && unallocated === 0 && (
        <div className="alert" data-tone="success" style={{ marginBottom: 20 }}>
          <span className="alert__mark" aria-hidden="true">✓</span>
          <span>
            Every confirmed delegate has a committee. Allocation emails go out automatically on
            save; lock a row to stop it moving again.
          </span>
        </div>
      )}

      <AllocationRows
        rows={data}
        committees={committees.map((c) => ({ slug: c.slug, name: c.name, seats: c.seats }))}
        canLock={atLeast(staff.role, 'superadmin')}
      />
    </>
  );
}
