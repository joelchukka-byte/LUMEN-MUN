/**
 * Authentication: password hashing, signed sessions, role checks.
 *
 * Two audiences share the mechanism but not the cookie:
 *   · delegates — sign in with the email + password set during registration
 *   · staff     — oc / admin / superadmin accounts for the operations console
 *
 * Sessions are signed with AUTH_SECRET *and* recorded in the `sessions` table,
 * so a superadmin can revoke a specific login or every login for an account.
 */

import 'server-only';
import { randomBytes, timingSafeEqual, createHmac } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq, and, isNull } from 'drizzle-orm';
import { db, sessions, adminUsers, registrations, type AdminRole } from '@/db';
import { hashPassword, verifyPassword, safeEqual } from './password';

export { hashPassword, verifyPassword, safeEqual };

const DELEGATE_COOKIE = 'lumen_delegate';
const ADMIN_COOKIE = 'lumen_staff';
const SESSION_DAYS = 30;

/* ---------------------------------------------------------------- secrets -- */

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET is not set: refusing to sign sessions with a default.');
  }
  // Development only: stable across reloads within a run, useless to an attacker
  // because it never leaves this process and changes on restart.
  const g = globalThis as unknown as { __lumenDevSecret?: string };
  return (g.__lumenDevSecret ??= randomBytes(32).toString('hex'));
}

/* ---------------------------------------------------------------- tokens --- */

function sign(sessionId: string): string {
  const mac = createHmac('sha256', secret()).update(sessionId).digest('base64url');
  return `${sessionId}.${mac}`;
}

function unsign(token: string | undefined): string | null {
  if (!token) return null;
  const idx = token.lastIndexOf('.');
  if (idx < 1) return null;

  const id = token.slice(0, idx);
  const mac = token.slice(idx + 1);
  const expected = createHmac('sha256', secret()).update(id).digest('base64url');

  if (mac.length !== expected.length) return null;
  return timingSafeEqual(Buffer.from(mac), Buffer.from(expected)) ? id : null;
}

/* --------------------------------------------------------------- sessions -- */

export type SessionKind = 'delegate' | 'admin';

async function createSession(kind: SessionKind, subject: string, userAgent?: string) {
  const id = randomBytes(24).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);

  await db.insert(sessions).values({ id, kind, subject, userAgent, expiresAt });

  const jar = await cookies();
  jar.set(kind === 'delegate' ? DELEGATE_COOKIE : ADMIN_COOKIE, sign(id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });

  return id;
}

async function readSession(kind: SessionKind): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(kind === 'delegate' ? DELEGATE_COOKIE : ADMIN_COOKIE)?.value;
  const id = unsign(raw);
  if (!id) return null;

  const [row] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, id), eq(sessions.kind, kind), isNull(sessions.revokedAt)))
    .limit(1);

  if (!row || row.expiresAt.getTime() < Date.now()) return null;
  return row.subject;
}

export async function destroySession(kind: SessionKind) {
  const jar = await cookies();
  const name = kind === 'delegate' ? DELEGATE_COOKIE : ADMIN_COOKIE;
  const id = unsign(jar.get(name)?.value);
  if (id) {
    await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, id));
  }
  jar.delete(name);
}

/* -------------------------------------------------------------- delegates -- */

export async function loginDelegate(email: string, password: string, userAgent?: string) {
  const [row] = await db
    .select()
    .from(registrations)
    .where(eq(registrations.email, email.trim().toLowerCase()))
    .limit(1);

  if (!row || !(await verifyPassword(password, row.passwordHash))) return null;

  await createSession('delegate', row.ref, userAgent);
  return row;
}

/** The signed-in delegate's registration, or null. */
export async function currentDelegate() {
  const ref = await readSession('delegate');
  if (!ref) return null;

  const [row] = await db.select().from(registrations).where(eq(registrations.ref, ref)).limit(1);
  return row ?? null;
}

/* ------------------------------------------------------------------ staff -- */

export type StaffIdentity = {
  username: string;
  displayName: string;
  role: AdminRole;
  builtIn: boolean;
  permissions: Record<string, boolean>;
};

/**
 * The built-in owner account. It never depends on the database, so a bad
 * migration or an empty `admin_users` table can't lock you out of your own
 * conference. Which password you type selects the role.
 */
function builtInOwner(username: string, password: string): StaffIdentity | null {
  const user = process.env.ADMIN_USERNAME || 'lumen-owner';
  if (username !== user) return null;

  const superPw = process.env.SUPERADMIN_PASSWORD;
  const adminPw = process.env.ADMIN_PASSWORD;

  if (superPw && safeEqual(password, superPw)) {
    return { username: user, displayName: 'Owner', role: 'superadmin', builtIn: true, permissions: {} };
  }
  if (adminPw && safeEqual(password, adminPw)) {
    return { username: user, displayName: 'Owner', role: 'admin', builtIn: true, permissions: {} };
  }
  return null;
}

export async function loginStaff(
  username: string,
  password: string,
  userAgent?: string
): Promise<StaffIdentity | null> {
  const owner = builtInOwner(username.trim(), password);
  if (owner) {
    await createSession('admin', owner.username, userAgent);
    return owner;
  }

  const [row] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.username, username.trim()))
    .limit(1);

  if (!row || !row.active || !(await verifyPassword(password, row.passwordHash))) return null;

  await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, row.id));
  await createSession('admin', row.username, userAgent);

  return {
    username: row.username,
    displayName: row.displayName || row.username,
    role: row.role,
    builtIn: false,
    permissions: row.permissions,
  };
}

export async function currentStaff(): Promise<StaffIdentity | null> {
  const username = await readSession('admin');
  if (!username) return null;

  if (username === (process.env.ADMIN_USERNAME || 'lumen-owner')) {
    return { username, displayName: 'Owner', role: 'superadmin', builtIn: true, permissions: {} };
  }

  const [row] = await db.select().from(adminUsers).where(eq(adminUsers.username, username)).limit(1);
  if (!row || !row.active) return null;

  return {
    username: row.username,
    displayName: row.displayName || row.username,
    role: row.role,
    builtIn: false,
    permissions: row.permissions,
  };
}

const RANK: Record<AdminRole, number> = { oc: 1, admin: 2, superadmin: 3 };

export function atLeast(role: AdminRole | undefined, needed: AdminRole): boolean {
  return !!role && RANK[role] >= RANK[needed];
}

/**
 * For page renders: sends the visitor to sign-in rather than throwing.
 *
 * Layouts and pages render in parallel, so the admin layout's own guard cannot
 * stop a page from rendering — without this, an expired or revoked session
 * lands on the error boundary instead of the login form.
 */
export async function requireStaffPage(needed: AdminRole = 'oc'): Promise<StaffIdentity> {
  const staff = await currentStaff();
  if (!staff) redirect('/admin/login');
  if (!atLeast(staff.role, needed)) redirect('/admin');
  return staff;
}

/** For actions and route handlers: throws, so the caller can answer with a status. */
export async function requireStaff(needed: AdminRole = 'oc'): Promise<StaffIdentity> {
  const staff = await currentStaff();
  if (!staff) throw new AuthError('Not signed in', 401);
  if (!atLeast(staff.role, needed)) throw new AuthError('Insufficient role', 403);
  return staff;
}

export async function requireDelegate() {
  const delegate = await currentDelegate();
  if (!delegate) throw new AuthError('Not signed in', 401);
  return delegate;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
