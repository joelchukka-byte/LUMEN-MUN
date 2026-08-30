import { desc, sql } from 'drizzle-orm';
import { db, registrations, checkinLog } from '@/db';
import { requireStaffPage } from '@/lib/auth';
import { CheckinDesk } from '@/components/admin/CheckinDesk';
import { formatDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Check-in' };

export default async function CheckinPage() {
  await requireStaffPage('oc');

  const [[counts], recent] = await Promise.all([
    db
      .select({
        approved: sql<number>`count(*) filter (where ${registrations.status} = 'approved')::int`,
        checkedIn: sql<number>`count(*) filter (where ${registrations.checkedInAt} is not null)::int`,
        kits: sql<number>`count(*) filter (where ${registrations.kitGivenAt} is not null)::int`,
      })
      .from(registrations),
    db.select().from(checkinLog).orderBy(desc(checkinLog.createdAt)).limit(10),
  ]);

  const remaining = Math.max(0, counts.approved - counts.checkedIn);

  return (
    <>
      <div className="console__head">
        <div>
          <p className="label">Check-in</p>
          <h1 className="console__title">Registration desk</h1>
        </div>
      </div>

      <div className="metric-row" style={{ marginBottom: 26 }}>
        <div className="metric">
          <p className="metric__label">CHECKED IN</p>
          <p className="metric__value metric__value--gold">{counts.checkedIn}</p>
          <p className="metric__note">OF {counts.approved} CONFIRMED</p>
        </div>
        <div className="metric">
          <p className="metric__label">STILL TO ARRIVE</p>
          <p className="metric__value">{remaining}</p>
          <p className="metric__note">NOT YET ON SITE</p>
        </div>
        <div className="metric">
          <p className="metric__label">KITS ISSUED</p>
          <p className="metric__value">{counts.kits}</p>
          <p className="metric__note">DELEGATE PACKS HANDED OUT</p>
        </div>
      </div>

      <CheckinDesk />

      {recent.length > 0 && (
        <>
          <h2 className="section-title section-title--sm stack-36" style={{ marginBottom: 18 }}>
            Recent activity
          </h2>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>WHEN</th>
                  <th>REF</th>
                  <th>ACTION</th>
                  <th>BY</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((row) => (
                  <tr key={row.id}>
                    <td className="mono">{formatDateTime(row.createdAt)}</td>
                    <td className="mono">{row.ref}</td>
                    <td>{row.action.replace('_', ' ')}</td>
                    <td>{row.actor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
