import { asc, desc, eq, and, isNull, sql } from 'drizzle-orm';
import { db, adminUsers, sessions } from '@/db';
import { requireStaffPage } from '@/lib/auth';
import { AccountRows } from '@/components/admin/AccountRows';
import { RecordForm, Field, Select } from '@/components/admin/RecordForm';
import { createStaffAccount } from '@/lib/actions/admin';
import { formatDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Staff accounts' };

const ROLES: Array<[string, string]> = [
  ['oc', 'OC: check-in and kits only'],
  ['admin', 'Admin: registrations, payments, allocations'],
  ['superadmin', 'Superadmin: everything, including content and accounts'],
];

export default async function AccountsPage() {
  const staff = await requireStaffPage('superadmin');

  const [accounts, live] = await Promise.all([
    db.select().from(adminUsers).orderBy(asc(adminUsers.role), asc(adminUsers.username)),
    db
      .select()
      .from(sessions)
      // Expiry is compared in the database, so the count reflects Postgres's
      // clock rather than the web server's.
      .where(
        and(
          eq(sessions.kind, 'admin'),
          isNull(sessions.revokedAt),
          sql`${sessions.expiresAt} > now()`
        )
      )
      .orderBy(desc(sessions.createdAt))
      .limit(50),
  ]);

  const liveBySubject = new Map<string, number>();
  for (const session of live) {
    liveBySubject.set(session.subject, (liveBySubject.get(session.subject) ?? 0) + 1);
  }

  return (
    <>
      <div className="console__head">
        <div>
          <p className="label">Governance</p>
          <h1 className="console__title">Staff accounts</h1>
        </div>
        <span className="readout">
          SIGNED IN AS {staff.username.toUpperCase()} · {staff.role.toUpperCase()}
        </span>
      </div>

      <div className="alert" data-tone="info" style={{ marginBottom: 24 }}>
        <span className="alert__mark" aria-hidden="true">i</span>
        <span>
          The built-in owner account (<code>{process.env.ADMIN_USERNAME || 'lumen-owner'}</code>) is
          set by environment variable and never appears here: it exists so a database problem can
          never lock you out. Change its passwords before the conference.
        </span>
      </div>

      <AccountRows
        rows={accounts.map((a) => ({
          id: a.id,
          username: a.username,
          displayName: a.displayName,
          role: a.role,
          active: a.active,
          createdBy: a.createdBy,
          lastLoginAt: a.lastLoginAt ? formatDateTime(a.lastLoginAt) : null,
          liveSessions: liveBySubject.get(a.username) ?? 0,
        }))}
      />

      <RecordForm action={createStaffAccount} title="Create an account" saveLabel="Create account">
        <div className="form-row">
          <Field label="Username" name="username" hint="lowercase, no spaces" />
          <Field label="Display name" name="displayName" placeholder="e.g. Finance desk" />
        </div>
        <div className="form-row">
          <Field label="Password" name="password" type="password" hint="min 10 characters" />
          <Select label="Role" name="role" options={ROLES} />
        </div>
      </RecordForm>
    </>
  );
}
