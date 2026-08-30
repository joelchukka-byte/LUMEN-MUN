import Link from 'next/link';
import { desc } from 'drizzle-orm';
import { db, registrations, auditLog } from '@/db';
import { requireStaffPage, atLeast } from '@/lib/auth';
import { conferenceStats } from '@/lib/actions/admin';
import { getRegistrationSettings } from '@/lib/content';
import { rupees, formatDateTime, STATUS_LABEL } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Overview' };

export default async function AdminOverviewPage() {
  const staff = await requireStaffPage('oc');
  const [stats, settings] = await Promise.all([conferenceStats(), getRegistrationSettings()]);

  const recent = await db
    .select()
    .from(registrations)
    .orderBy(desc(registrations.createdAt))
    .limit(8);

  const activity = atLeast(staff.role, 'superadmin')
    ? await db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(8)
    : [];

  const fillRate = settings.seatsCap
    ? Math.round((stats.approved / settings.seatsCap) * 100)
    : 0;

  return (
    <>
      <div className="console__head">
        <div>
          <p className="label">Overview</p>
          <h1 className="console__title">Edition I at a glance</h1>
        </div>
        {atLeast(staff.role, 'admin') && (
          <div className="row-actions">
            <Link className="btn-mini" href="/admin/registrations?status=pending_review">
              Review queue ({stats.pending})
            </Link>
            <Link className="btn-mini" href="/admin/allocations">
              Allocations
            </Link>
          </div>
        )}
      </div>

      <div className="metric-row">
        <div className="metric">
          <p className="metric__label">CONFIRMED</p>
          <p className="metric__value metric__value--gold">{stats.approved}</p>
          <p className="metric__note">
            {settings.seatsCap ? `${fillRate}% OF ${settings.seatsCap} SEATS` : 'SEATS FILLED'}
          </p>
        </div>
        <div className="metric">
          <p className="metric__label">AWAITING REVIEW</p>
          <p className="metric__value metric__value--flare">{stats.pending}</p>
          <p className="metric__note">PAYMENT PROOF SUBMITTED</p>
        </div>
        <div className="metric">
          <p className="metric__label">UNPAID</p>
          <p className="metric__value">{stats.unpaid}</p>
          <p className="metric__note">REGISTERED, NOT YET PAID</p>
        </div>
        <div className="metric">
          <p className="metric__label">ALLOCATED</p>
          <p className="metric__value">{stats.allocated}</p>
          <p className="metric__note">COMMITTEE ASSIGNED</p>
        </div>
        <div className="metric">
          <p className="metric__label">CHECKED IN</p>
          <p className="metric__value">{stats.checkedIn}</p>
          <p className="metric__note">ON SITE</p>
        </div>
        {atLeast(staff.role, 'admin') && (
          <div className="metric">
            <p className="metric__label">CONFIRMED REVENUE</p>
            <p className="metric__value metric__value--gold">{rupees(stats.revenue)}</p>
            <p className="metric__note">{stats.delegations} SCHOOL DELEGATIONS</p>
          </div>
        )}
      </div>

      {stats.pending > 0 && atLeast(staff.role, 'admin') && (
        <div className="alert stack-26" data-tone="info">
          <span className="alert__mark" aria-hidden="true">i</span>
          <span>
            {stats.pending} payment {stats.pending === 1 ? 'proof is' : 'proofs are'} waiting on
            Finance.{' '}
            <Link href="/admin/registrations?status=pending_review">Open the review queue →</Link>
          </span>
        </div>
      )}

      {atLeast(staff.role, 'admin') && (
        <>
          <h2 className="section-title section-title--sm stack-36" style={{ marginBottom: 18 }}>
            Latest registrations
          </h2>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>REF</th>
                  <th>DELEGATE</th>
                  <th>SCHOOL</th>
                  <th>1ST CHOICE</th>
                  <th>STATUS</th>
                  <th>REGISTERED</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((row) => (
                  <tr key={row.id}>
                    <td className="mono">{row.ref}</td>
                    <td>{row.name}</td>
                    <td>{row.school}</td>
                    <td>{row.committee1}</td>
                    <td>
                      <span className="pill" data-tone={row.status}>
                        {STATUS_LABEL[row.status]}
                      </span>
                    </td>
                    <td className="mono">{formatDateTime(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {recent.length === 0 && (
            <div className="empty-state">
              <p className="empty-state__mark">[ ]</p>
              <p>No registrations yet.</p>
            </div>
          )}
        </>
      )}

      {activity.length > 0 && (
        <>
          <h2 className="section-title section-title--sm stack-36" style={{ marginBottom: 18 }}>
            Recent activity
          </h2>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>WHEN</th>
                  <th>WHO</th>
                  <th>ACTION</th>
                  <th>TARGET</th>
                  <th>DETAIL</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((row) => (
                  <tr key={row.id}>
                    <td className="mono">{formatDateTime(row.createdAt)}</td>
                    <td>{row.actor}</td>
                    <td className="mono">{row.action}</td>
                    <td className="mono">{row.target ?? '-'}</td>
                    <td>{row.detail ?? '-'}</td>
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
