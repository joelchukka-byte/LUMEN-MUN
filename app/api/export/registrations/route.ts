export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db, registrations } from '@/db';
import { requireStaff, AuthError } from '@/lib/auth';
import { toCsv } from '@/lib/format';
import { writeAudit } from '@/lib/audit';

/** Delegate export for Finance and Academics. Admin and above only. */
export async function GET(request: Request) {
  let staff;
  try {
    staff = await requireStaff('admin');
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 500;
    return NextResponse.json({ error: 'Not permitted' }, { status });
  }

  const status = new URL(request.url).searchParams.get('status');

  const rows = await db
    .select()
    .from(registrations)
    .where(status ? eq(registrations.status, status as never) : undefined)
    .orderBy(desc(registrations.createdAt));

  const csv = toCsv(
    rows.map((r) => ({
      Reference: r.ref,
      Name: r.name,
      Email: r.email,
      Phone: r.phone,
      School: r.school,
      Grade: r.grade,
      City: r.city ?? '',
      Gender: r.gender ?? '',
      'Emergency contact': r.emergencyContact ?? '',
      Track: r.track,
      'Choice 1': r.committee1,
      'Choice 2': r.committee2 ?? '',
      'Choice 3': r.committee3 ?? '',
      'Portfolio preference': r.countryPref1 ?? '',
      Experience: r.experience ?? '',
      Fee: r.fee,
      Accommodation: r.accommodation ? 'Yes' : 'No',
      Status: r.status,
      'Pay method': r.payMethod ?? '',
      'UPI reference': r.upiTxnId ?? '',
      'Allocated committee': r.assignedCommittee ?? '',
      'Allocated portfolio': r.assignedCountry ?? '',
      'Allocation locked': r.allocationLocked ? 'Yes' : 'No',
      'Checked in': r.checkedInAt?.toISOString() ?? '',
      'Kit given': r.kitGivenAt?.toISOString() ?? '',
      'Email verified': r.emailVerified ? 'Yes' : 'No',
      Registered: r.createdAt.toISOString(),
    }))
  );

  await writeAudit({
    actor: staff.username,
    role: staff.role,
    action: 'registrations.export',
    detail: `${rows.length} rows${status ? ` (${status})` : ''}`,
  });

  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(`﻿${csv}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="lumen-mun-registrations-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
