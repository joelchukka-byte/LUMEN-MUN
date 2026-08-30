'use server';

import { revalidatePath } from 'next/cache';
import { eq, and, sql } from 'drizzle-orm';
import {
  db,
  registrations,
  schoolDelegations,
  allocationHistory,
  checkinLog,
  dailyCheckins,
  adminUsers,
  sessions,
  announcements,
  committees,
  type AdminRole,
} from '@/db';
import { requireStaff, AuthError } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import { writeAudit } from '@/lib/audit';
import { sendMail, templates } from '@/lib/mail';
import { normaliseRef } from '@/lib/ref';

export type ActionResult = { ok: boolean; message: string };

/** Wraps an action so an auth failure becomes a message instead of a crash. */
async function guarded(
  role: AdminRole,
  run: (staff: Awaited<ReturnType<typeof requireStaff>>) => Promise<ActionResult>
): Promise<ActionResult> {
  try {
    const staff = await requireStaff(role);
    return await run(staff);
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        ok: false,
        message:
          error.status === 403
            ? 'Your role does not permit that.'
            : 'Your session has expired: sign in again.',
      };
    }
    console.error('[admin-action]', error);
    return { ok: false, message: (error as Error).message || 'That did not work.' };
  }
}

/* ------------------------------------------------------- payment review -- */

export async function approvePayment(ref: string): Promise<ActionResult> {
  return guarded('admin', async (staff) => {
    const [row] = await db.select().from(registrations).where(eq(registrations.ref, ref)).limit(1);
    if (!row) return { ok: false, message: 'No such registration.' };

    await db
      .update(registrations)
      .set({ status: 'approved', reviewNote: null, updatedAt: new Date() })
      .where(eq(registrations.id, row.id));

    await writeAudit({
      actor: staff.username,
      role: staff.role,
      action: 'registration.approve',
      target: ref,
      detail: `${row.name} · ${row.email}`,
    });

    const mail = templates.paymentApproved(row.name, ref);
    await sendMail({ to: row.email, ...mail });

    revalidatePath('/admin/registrations');
    revalidatePath('/admin');
    return { ok: true, message: `${ref} confirmed.` };
  });
}

export async function rejectPayment(ref: string, reason: string): Promise<ActionResult> {
  return guarded('admin', async (staff) => {
    if (!reason.trim()) {
      return { ok: false, message: 'Give a reason: the delegate sees it and needs to act on it.' };
    }

    const [row] = await db.select().from(registrations).where(eq(registrations.ref, ref)).limit(1);
    if (!row) return { ok: false, message: 'No such registration.' };

    await db
      .update(registrations)
      .set({ status: 'rejected', reviewNote: reason.trim(), updatedAt: new Date() })
      .where(eq(registrations.id, row.id));

    await writeAudit({
      actor: staff.username,
      role: staff.role,
      action: 'registration.reject',
      target: ref,
      detail: reason.trim(),
    });

    const mail = templates.paymentRejected(row.name, ref, reason.trim());
    await sendMail({ to: row.email, ...mail });

    revalidatePath('/admin/registrations');
    revalidatePath('/admin');
    return { ok: true, message: `${ref} sent back for a new proof.` };
  });
}

export async function setRegistrationStatus(ref: string, status: string): Promise<ActionResult> {
  return guarded('admin', async (staff) => {
    const allowed = ['submitted', 'pending_review', 'approved', 'rejected', 'waitlisted', 'cancelled'];
    if (!allowed.includes(status)) return { ok: false, message: 'Unknown status.' };

    await db
      .update(registrations)
      .set({ status: status as never, updatedAt: new Date() })
      .where(eq(registrations.ref, ref));

    await writeAudit({
      actor: staff.username,
      role: staff.role,
      action: 'registration.status',
      target: ref,
      detail: status,
    });

    revalidatePath('/admin/registrations');
    return { ok: true, message: `${ref} → ${status.replace('_', ' ')}.` };
  });
}

/* ---------------------------------------------------------- allocations -- */

export async function allocate(
  ref: string,
  committee: string,
  country: string
): Promise<ActionResult> {
  return guarded('admin', async (staff) => {
    const [row] = await db.select().from(registrations).where(eq(registrations.ref, ref)).limit(1);
    if (!row) return { ok: false, message: 'No such registration.' };

    if (row.allocationLocked && staff.role !== 'superadmin') {
      return { ok: false, message: 'That allocation is locked: only a superadmin can move it.' };
    }

    await db
      .update(registrations)
      .set({
        assignedCommittee: committee || null,
        assignedCountry: country || null,
        allocatedAt: new Date(),
        allocatedBy: staff.username,
        updatedAt: new Date(),
      })
      .where(eq(registrations.id, row.id));

    await db.insert(allocationHistory).values({
      ref,
      actor: staff.username,
      action: committee ? 'allocate' : 'deallocate',
      oldCommittee: row.assignedCommittee,
      newCommittee: committee || null,
      oldCountry: row.assignedCountry,
      newCountry: country || null,
    });

    await writeAudit({
      actor: staff.username,
      role: staff.role,
      action: 'allocation.set',
      target: ref,
      detail: `${committee || '-'} / ${country || '-'}`,
    });

    // Only tell the delegate once there is something to tell them.
    if (committee && row.status === 'approved') {
      const mail = templates.allocated(row.name, ref, committee, country || 'To be announced');
      await sendMail({ to: row.email, ...mail });
    }

    revalidatePath('/admin/allocations');
    return { ok: true, message: `${ref} allocated.` };
  });
}

export async function setAllocationLock(ref: string, locked: boolean): Promise<ActionResult> {
  return guarded('superadmin', async (staff) => {
    await db
      .update(registrations)
      .set({ allocationLocked: locked, updatedAt: new Date() })
      .where(eq(registrations.ref, ref));

    await db.insert(allocationHistory).values({
      ref,
      actor: staff.username,
      action: locked ? 'lock' : 'unlock',
    });

    await writeAudit({
      actor: staff.username,
      role: staff.role,
      action: locked ? 'allocation.lock' : 'allocation.unlock',
      target: ref,
    });

    revalidatePath('/admin/allocations');
    return { ok: true, message: `${ref} ${locked ? 'locked' : 'unlocked'}.` };
  });
}

/* ------------------------------------------------------------- check-in -- */

export async function checkIn(rawRef: string): Promise<ActionResult> {
  return guarded('oc', async (staff) => {
    const ref = normaliseRef(rawRef);
    const [row] = await db.select().from(registrations).where(eq(registrations.ref, ref)).limit(1);

    if (!row) return { ok: false, message: `No delegate with reference ${ref}.` };
    if (row.status !== 'approved') {
      return { ok: false, message: `${row.name} is not confirmed: status is ${row.status.replace('_', ' ')}.` };
    }
    if (row.checkedInAt) {
      return { ok: false, message: `${row.name} was already checked in.` };
    }

    const now = new Date();
    await db
      .update(registrations)
      .set({ checkedInAt: now, checkedInBy: staff.username, updatedAt: now })
      .where(eq(registrations.id, row.id));

    await db.insert(checkinLog).values({ ref, action: 'checked_in', actor: staff.username });

    // Same-day roll call, so multi-day attendance is countable.
    const day = now.toISOString().slice(0, 10);
    await db
      .insert(dailyCheckins)
      .values({ ref, day, checkedInBy: staff.username })
      .onConflictDoNothing();

    await writeAudit({ actor: staff.username, role: staff.role, action: 'checkin', target: ref });

    revalidatePath('/admin/checkin');
    return { ok: true, message: `${row.name} checked in, ${row.assignedCommittee ?? 'no committee yet'}.` };
  });
}

export async function giveKit(rawRef: string): Promise<ActionResult> {
  return guarded('oc', async (staff) => {
    const ref = normaliseRef(rawRef);
    const [row] = await db.select().from(registrations).where(eq(registrations.ref, ref)).limit(1);

    if (!row) return { ok: false, message: `No delegate with reference ${ref}.` };
    if (row.kitGivenAt) return { ok: false, message: `${row.name} already collected a kit.` };

    const now = new Date();
    await db
      .update(registrations)
      .set({ kitGivenAt: now, kitGivenBy: staff.username, updatedAt: now })
      .where(eq(registrations.id, row.id));

    await db.insert(checkinLog).values({ ref, action: 'kit_given', actor: staff.username });
    await writeAudit({ actor: staff.username, role: staff.role, action: 'kit', target: ref });

    revalidatePath('/admin/checkin');
    return { ok: true, message: `Kit issued to ${row.name}.` };
  });
}

/** Looks a delegate up for the scanner without changing anything. */
export async function lookupDelegate(rawRef: string) {
  try {
    await requireStaff('oc');
  } catch {
    return null;
  }

  const ref = normaliseRef(rawRef);
  const [row] = await db.select().from(registrations).where(eq(registrations.ref, ref)).limit(1);
  if (!row) return null;

  // Resolve the slug to the committee's actual name — the desk reads this
  // aloud, and "human-rights-council" is not a thing anyone says.
  let committee = row.assignedCommittee;
  if (committee) {
    const [c] = await db
      .select({ name: committees.name })
      .from(committees)
      .where(eq(committees.slug, committee))
      .limit(1);
    committee = c?.name ?? committee;
  }

  return {
    ref: row.ref,
    name: row.name,
    school: row.school,
    status: row.status,
    committee,
    country: row.assignedCountry,
    checkedInAt: row.checkedInAt?.toISOString() ?? null,
    kitGivenAt: row.kitGivenAt?.toISOString() ?? null,
  };
}

/* ------------------------------------------------------------- accounts -- */

export async function createStaffAccount(formData: FormData): Promise<ActionResult> {
  return guarded('superadmin', async (staff) => {
    const username = String(formData.get('username') ?? '').trim();
    const displayName = String(formData.get('displayName') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const role = String(formData.get('role') ?? 'oc') as AdminRole;

    if (username.length < 3) return { ok: false, message: 'Username needs at least 3 characters.' };
    if (password.length < 10) {
      return { ok: false, message: 'Staff passwords need at least 10 characters.' };
    }
    if (!['oc', 'admin', 'superadmin'].includes(role)) {
      return { ok: false, message: 'Unknown role.' };
    }

    const [clash] = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.username, username))
      .limit(1);
    if (clash) return { ok: false, message: 'That username is taken.' };

    await db.insert(adminUsers).values({
      username,
      displayName: displayName || username,
      passwordHash: await hashPassword(password),
      role,
      createdBy: staff.username,
    });

    await writeAudit({
      actor: staff.username,
      role: staff.role,
      action: 'account.create',
      target: username,
      detail: role,
    });

    revalidatePath('/admin/accounts');
    return { ok: true, message: `${username} created as ${role}.` };
  });
}

export async function setStaffActive(id: number, active: boolean): Promise<ActionResult> {
  return guarded('superadmin', async (staff) => {
    const [row] = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
    if (!row) return { ok: false, message: 'No such account.' };

    await db.update(adminUsers).set({ active }).where(eq(adminUsers.id, id));

    // Deactivating an account cuts its live sessions immediately.
    if (!active) {
      await db
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(and(eq(sessions.kind, 'admin'), eq(sessions.subject, row.username)));
    }

    await writeAudit({
      actor: staff.username,
      role: staff.role,
      action: active ? 'account.enable' : 'account.disable',
      target: row.username,
    });

    revalidatePath('/admin/accounts');
    return { ok: true, message: `${row.username} ${active ? 'enabled' : 'disabled'}.` };
  });
}

export async function revokeAllSessions(username: string): Promise<ActionResult> {
  return guarded('superadmin', async (staff) => {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.kind, 'admin'), eq(sessions.subject, username)));

    await writeAudit({
      actor: staff.username,
      role: staff.role,
      action: 'account.revoke_sessions',
      target: username,
    });

    revalidatePath('/admin/accounts');
    return { ok: true, message: `Signed ${username} out everywhere.` };
  });
}

/* --------------------------------------------------------- announcements -- */

export async function postAnnouncement(formData: FormData): Promise<ActionResult> {
  return guarded('admin', async (staff) => {
    const title = String(formData.get('title') ?? '').trim();
    const body = String(formData.get('body') ?? '').trim();
    const audience = String(formData.get('audience') ?? 'all');

    if (!title || !body) return { ok: false, message: 'A title and a body are both required.' };

    await db.insert(announcements).values({ title, body, audience, createdBy: staff.username });

    await writeAudit({
      actor: staff.username,
      role: staff.role,
      action: 'announcement.post',
      target: title,
    });

    revalidatePath('/admin');
    revalidatePath('/dashboard');
    return { ok: true, message: 'Announcement posted.' };
  });
}

/* ------------------------------------------------------------ delegations -- */

export async function setDelegationStatus(ref: string, status: string): Promise<ActionResult> {
  return guarded('admin', async (staff) => {
    await db
      .update(schoolDelegations)
      .set({ status: status as never, updatedAt: new Date() })
      .where(eq(schoolDelegations.ref, ref));

    await writeAudit({
      actor: staff.username,
      role: staff.role,
      action: 'delegation.status',
      target: ref,
      detail: status,
    });

    revalidatePath('/admin/delegations');
    return { ok: true, message: `${ref} → ${status.replace('_', ' ')}.` };
  });
}

/* ----------------------------------------------------------------- stats -- */

export async function conferenceStats() {
  await requireStaff('oc');

  const [counts] = await db
    .select({
      total: sql<number>`count(*)::int`,
      approved: sql<number>`count(*) filter (where ${registrations.status} = 'approved')::int`,
      pending: sql<number>`count(*) filter (where ${registrations.status} = 'pending_review')::int`,
      unpaid: sql<number>`count(*) filter (where ${registrations.status} = 'submitted')::int`,
      rejected: sql<number>`count(*) filter (where ${registrations.status} = 'rejected')::int`,
      allocated: sql<number>`count(*) filter (where ${registrations.assignedCommittee} is not null)::int`,
      checkedIn: sql<number>`count(*) filter (where ${registrations.checkedInAt} is not null)::int`,
      revenue: sql<number>`coalesce(sum(${registrations.fee}) filter (where ${registrations.status} = 'approved'), 0)::int`,
    })
    .from(registrations);

  const [delegations] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schoolDelegations);

  return { ...counts, delegations: delegations?.n ?? 0 };
}
