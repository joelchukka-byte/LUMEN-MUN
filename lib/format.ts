import type { RegistrationStatus } from '@/db';

export const rupees = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

export function formatDate(value: string | Date | null | undefined, fallback = 'To be announced') {
  if (!value) return fallback;
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDateTime(value: string | Date | null | undefined, fallback = '-') {
  if (!value) return fallback;
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const STATUS_LABEL: Record<RegistrationStatus, string> = {
  submitted: 'Awaiting payment',
  pending_review: 'Pending review',
  approved: 'Confirmed',
  rejected: 'Action needed',
  waitlisted: 'Waitlisted',
  cancelled: 'Cancelled',
};

/** Where a delegate is in the lifecycle, for the dashboard progress rail. */
export const STATUS_STEP: Record<RegistrationStatus, number> = {
  submitted: 1,
  pending_review: 2,
  rejected: 2,
  approved: 3,
  waitlisted: 2,
  cancelled: 0,
};

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/** RFC 4180 CSV — quotes every field so commas and newlines survive Excel. */
export function toCsv(rows: Array<Record<string, unknown>>): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [
    headers.map(escape).join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ].join('\r\n');
}
