/**
 * Password hashing — scrypt with a per-password salt.
 *
 * Kept separate from lib/auth.ts (which is `server-only`) so seed scripts and
 * CLI tooling running outside the Next.js runtime can hash passwords too.
 */

import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb);

/** Format: scrypt$<salt-hex>$<hash-hex> */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = (await scrypt(password.normalize('NFKC'), salt, 64)) as Buffer;
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [scheme, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, 'hex');
  const actual = (await scrypt(
    password.normalize('NFKC'),
    Buffer.from(saltHex, 'hex'),
    expected.length
  )) as Buffer;

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** Constant-time compare for plaintext env passwords (the built-in owner login). */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
