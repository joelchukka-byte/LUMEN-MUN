'use server';

import { randomBytes } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { db, registrations, schoolDelegations } from '@/db';
import {
  individualRegistration,
  schoolRegistration,
  fieldErrors,
} from '@/lib/validation';
import { hashPassword } from '@/lib/password';
import { newDelegateRef, newDelegationRef } from '@/lib/ref';
import { sendMail, templates } from '@/lib/mail';
import { getPricing, registrationState } from '@/lib/content';
import { writeAudit } from '@/lib/audit';

export type RegisterState = {
  ok: boolean;
  ref?: string;
  fee?: number;
  message?: string;
  errors?: Record<string, string>;
};

/** Retries on the astronomically unlikely reference collision. */
async function uniqueRef(make: () => string, exists: (ref: string) => Promise<boolean>) {
  for (let i = 0; i < 6; i++) {
    const ref = make();
    if (!(await exists(ref))) return ref;
  }
  throw new Error('Could not allocate a reference code');
}

/* ------------------------------------------------------------- individual -- */

export async function registerIndividual(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const state = await registrationState();
  if (!state.open) {
    return { ok: false, message: state.message || 'Registration is closed.' };
  }

  const raw = Object.fromEntries(formData) as Record<string, string>;

  const parsed = individualRegistration.safeParse({
    ...raw,
    accommodation: raw.accommodation === 'on' || raw.accommodation === 'true',
    agreeCoc: raw.agreeCoc === 'on',
    agreeLiability: raw.agreeLiability === 'on',
    agreeTechnology: raw.agreeTechnology === 'on',
  });

  if (!parsed.success) {
    return {
      ok: false,
      errors: fieldErrors(parsed.error),
      message: 'Some details need another look.',
    };
  }

  const data = parsed.data;

  // One delegate account per email address.
  const [clash] = await db
    .select({ ref: registrations.ref })
    .from(registrations)
    .where(eq(registrations.email, data.email))
    .limit(1);

  if (clash) {
    return {
      ok: false,
      errors: { email: 'That email is already registered: sign in instead.' },
      message: 'This email already has a delegate account.',
    };
  }

  const pricing = await getPricing();
  const fee = pricing.baseAmount + (data.accommodation ? pricing.accommodationAmount : 0);

  const ref = await uniqueRef(newDelegateRef, async (candidate) => {
    const [row] = await db
      .select({ id: registrations.id })
      .from(registrations)
      .where(eq(registrations.ref, candidate))
      .limit(1);
    return !!row;
  });

  const verificationToken = randomBytes(24).toString('base64url');

  await db.insert(registrations).values({
    ref,
    name: data.name,
    email: data.email,
    phone: data.phone,
    school: data.school,
    grade: data.grade,
    city: data.city || null,
    gender: data.gender || null,
    emergencyContact: data.emergencyContact || null,
    track: 'individual',
    committee1: data.committee1,
    committee2: data.committee2 || null,
    committee3: data.committee3 || null,
    countryPref1: data.countryPref1 || null,
    countryPref2: data.countryPref2 || null,
    experience: data.experience || null,
    portfolioNote: data.portfolioNote || null,
    notes: data.notes || null,
    passwordHash: await hashPassword(data.password),
    verificationToken,
    feeTierCode: pricing.base?.code ?? null,
    fee,
    accommodation: data.accommodation,
    status: 'submitted',
  });

  await writeAudit({
    actor: ref,
    role: 'delegate',
    action: 'registration.created',
    target: ref,
    detail: `${data.name} · ${data.committee1}`,
  });

  // Mail failures never block the registration that is already saved.
  const received = templates.registrationReceived(data.name, ref, fee);
  await sendMail({ to: data.email, ...received });

  const verify = templates.verifyEmail(data.name, verificationToken);
  await sendMail({ to: data.email, ...verify });

  return { ok: true, ref, fee };
}

/* ----------------------------------------------------------------- school -- */

export async function registerSchool(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const state = await registrationState();
  if (!state.open) {
    return { ok: false, message: state.message || 'Registration is closed.' };
  }

  const parsed = schoolRegistration.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      errors: fieldErrors(parsed.error),
      message: 'Some details need another look.',
    };
  }

  const data = parsed.data;
  const pricing = await getPricing();

  // Quote from the lower bound of the declared band — the invoice is issued
  // against the final headcount after review.
  const lowerBound = Number(/\d+/.exec(data.sizeBand)?.[0] ?? 5);
  const stayHeads =
    data.accommodation === 'full' ? lowerBound : data.accommodation === 'partial' ? 1 : 0;
  const feeQuoted = pricing.baseAmount * lowerBound + pricing.accommodationAmount * stayHeads;

  const ref = await uniqueRef(newDelegationRef, async (candidate) => {
    const [row] = await db
      .select({ id: schoolDelegations.id })
      .from(schoolDelegations)
      .where(eq(schoolDelegations.ref, candidate))
      .limit(1);
    return !!row;
  });

  await db.insert(schoolDelegations).values({
    ref,
    institution: data.institution,
    coordinatorName: data.coordinatorName,
    designation: data.designation || null,
    email: data.email,
    phone: data.phone,
    sizeBand: data.sizeBand,
    delegateCount: lowerBound,
    facultyCount: data.facultyCount || null,
    accommodation: data.accommodation,
    committeeSpread: data.committeeSpread || null,
    invoicingNotes: data.invoicingNotes || null,
    feeQuoted,
    status: 'submitted',
  });

  await writeAudit({
    actor: ref,
    role: 'delegate',
    action: 'delegation.created',
    target: ref,
    detail: `${data.institution} · ${data.sizeBand}`,
  });

  await sendMail({
    to: data.email,
    subject: `Delegation registered, ${ref}`,
    text: `Hello ${data.coordinatorName},

${data.institution} is registered as a school delegation for LUMEN MUN Edition I.

Delegation reference: ${ref}
Declared size: ${data.sizeBand} delegates
Indicative total: ₹${feeQuoted.toLocaleString('en-IN')}

Finance will review the request and issue a single invoice against your final headcount. Individual delegates should register separately and quote ${ref} so their seats are grouped under your delegation.

- Delegate Affairs, LUMEN MUN`,
  });

  return { ok: true, ref, fee: feeQuoted };
}

/* ---------------------------------------------------------------- payment -- */

export type PaymentState = { ok: boolean; message?: string; errors?: Record<string, string> };

/**
 * Records a UPI payment claim against a registration and moves it into the
 * review queue. The proof itself (screenshot or PDF) is uploaded separately via
 * /api/proof, which streams it to disk and stores only the filename here.
 */
export async function submitPaymentReference(
  _prev: PaymentState,
  formData: FormData
): Promise<PaymentState> {
  const ref = String(formData.get('ref') ?? '').trim();
  const txnId = String(formData.get('upiTxnId') ?? '').trim();

  if (!ref) return { ok: false, message: 'Missing registration reference.' };
  if (txnId.length < 6) {
    return { ok: false, errors: { upiTxnId: 'Enter the full UPI transaction reference.' } };
  }

  const [row] = await db.select().from(registrations).where(eq(registrations.ref, ref)).limit(1);
  if (!row) return { ok: false, message: 'We could not find that registration.' };
  if (row.status === 'approved') return { ok: true, message: 'This seat is already confirmed.' };

  await db
    .update(registrations)
    .set({
      payMethod: 'reference',
      upiTxnId: txnId,
      status: 'pending_review',
      reviewNote: null,
      updatedAt: new Date(),
    })
    .where(eq(registrations.ref, ref));

  await writeAudit({
    actor: ref,
    role: 'delegate',
    action: 'payment.reference',
    target: ref,
    detail: txnId,
  });

  return {
    ok: true,
    message:
      'Payment reference received. Finance verifies within 48 hours and you will get an email either way.',
  };
}

/** Live seat count for the registration page's capacity readout. */
export async function seatsTaken(): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(registrations)
    .where(sql`${registrations.status} in ('submitted','pending_review','approved')`);
  return row?.n ?? 0;
}
