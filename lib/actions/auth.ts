'use server';

import { randomBytes } from 'node:crypto';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq, and, gt } from 'drizzle-orm';
import { db, registrations } from '@/db';
import { loginDelegate, loginStaff, destroySession } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import { delegateLogin, staffLogin, fieldErrors } from '@/lib/validation';
import { sendMail, templates } from '@/lib/mail';
import { writeAudit } from '@/lib/audit';

export type AuthState = { ok: boolean; message?: string; errors?: Record<string, string> };

const agent = async () => (await headers()).get('user-agent') ?? undefined;

/* -------------------------------------------------------------- delegates -- */

export async function delegateSignIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = delegateLogin.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error) };
  }

  const row = await loginDelegate(parsed.data.email, parsed.data.password, await agent());

  // One message for both wrong-email and wrong-password, so the form cannot be
  // used to discover which addresses are registered.
  if (!row) {
    return { ok: false, message: 'That email and password do not match a delegate account.' };
  }

  await writeAudit({ actor: row.ref, role: 'delegate', action: 'delegate.login', target: row.ref });
  redirect('/dashboard');
}

export async function delegateSignOut() {
  await destroySession('delegate');
  redirect('/login');
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();

  // Always the same answer, whether or not the address exists.
  const answer: AuthState = {
    ok: true,
    message:
      'If that email has a delegate account, a reset link is on its way. The link is valid for one hour.',
  };

  if (!email) return { ok: false, errors: { email: 'Enter your email address.' } };

  const [row] = await db.select().from(registrations).where(eq(registrations.email, email)).limit(1);
  if (!row) return answer;

  const token = randomBytes(24).toString('base64url');
  await db
    .update(registrations)
    .set({ resetToken: token, resetTokenExpires: new Date(Date.now() + 3600_000) })
    .where(eq(registrations.id, row.id));

  const mail = templates.passwordReset(row.name, token);
  await sendMail({ to: row.email, ...mail });

  return answer;
}

export async function resetPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const token = String(formData.get('token') ?? '');
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('passwordConfirm') ?? '');

  if (password.length < 8) {
    return { ok: false, errors: { password: 'Use at least 8 characters.' } };
  }
  if (password !== confirm) {
    return { ok: false, errors: { passwordConfirm: 'Passwords do not match.' } };
  }

  const [row] = await db
    .select()
    .from(registrations)
    .where(and(eq(registrations.resetToken, token), gt(registrations.resetTokenExpires, new Date())))
    .limit(1);

  if (!row) {
    return { ok: false, message: 'That reset link has expired. Request a new one.' };
  }

  await db
    .update(registrations)
    .set({
      passwordHash: await hashPassword(password),
      resetToken: null,
      resetTokenExpires: null,
      updatedAt: new Date(),
    })
    .where(eq(registrations.id, row.id));

  await writeAudit({
    actor: row.ref,
    role: 'delegate',
    action: 'delegate.password_reset',
    target: row.ref,
  });

  return { ok: true, message: 'Password updated. You can sign in now.' };
}

/** Confirms a delegate's email from the link in their verification mail. */
export async function verifyEmail(token: string): Promise<'ok' | 'invalid' | 'already'> {
  if (!token) return 'invalid';

  const [row] = await db
    .select()
    .from(registrations)
    .where(eq(registrations.verificationToken, token))
    .limit(1);

  if (!row) return 'invalid';
  if (row.emailVerified) return 'already';

  await db
    .update(registrations)
    .set({ emailVerified: true, verificationToken: null, updatedAt: new Date() })
    .where(eq(registrations.id, row.id));

  await writeAudit({
    actor: row.ref,
    role: 'delegate',
    action: 'delegate.email_verified',
    target: row.ref,
  });

  revalidatePath('/dashboard');
  return 'ok';
}

/* ------------------------------------------------------------------ staff -- */

export async function staffSignIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = staffLogin.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  });

  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const identity = await loginStaff(parsed.data.username, parsed.data.password, await agent());
  if (!identity) return { ok: false, message: 'Those credentials were not accepted.' };

  await writeAudit({
    actor: identity.username,
    role: identity.role,
    action: 'staff.login',
    detail: identity.builtIn ? 'built-in owner account' : 'named account',
  });

  redirect('/admin');
}

export async function staffSignOut() {
  await destroySession('admin');
  redirect('/admin/login');
}
