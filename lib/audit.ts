import 'server-only';
import { db, auditLog } from '@/db';

/**
 * Append-only record of who did what.
 *
 * Every state change that a human could later dispute — an approval, a
 * rejection, an allocation, a check-in, a role change — writes a line here.
 * Auditing must never be the reason an operation fails, so a write error is
 * logged and swallowed rather than thrown.
 */
export async function writeAudit(entry: {
  actor: string;
  role?: string;
  action: string;
  target?: string;
  detail?: string;
}) {
  try {
    await db.insert(auditLog).values({
      actor: entry.actor,
      role: entry.role ?? null,
      action: entry.action,
      target: entry.target ?? null,
      detail: entry.detail ?? null,
    });
  } catch (error) {
    console.error('[audit:failed]', entry.action, error);
  }
}
