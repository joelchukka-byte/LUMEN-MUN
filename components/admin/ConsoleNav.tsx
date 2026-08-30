'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { AdminRole } from '@/db';

type Entry = { href: string; label: string; role: AdminRole };
type Section = { label: string; entries: Entry[] };

const SECTIONS: Section[] = [
  {
    label: 'RUN THE EVENT',
    entries: [
      { href: '/admin', label: 'Overview', role: 'oc' },
      { href: '/admin/registrations', label: 'Registrations', role: 'admin' },
      { href: '/admin/delegations', label: 'School delegations', role: 'admin' },
      { href: '/admin/allocations', label: 'Allocations', role: 'admin' },
      { href: '/admin/checkin', label: 'Check-in', role: 'oc' },
    ],
  },
  {
    label: 'SITE CONTENT',
    entries: [
      { href: '/admin/content/committees', label: 'Committees', role: 'superadmin' },
      { href: '/admin/content/secretariat', label: 'Secretariat', role: 'superadmin' },
      { href: '/admin/content/schedule', label: 'Schedule', role: 'superadmin' },
      { href: '/admin/content/sponsors', label: 'Sponsors', role: 'superadmin' },
      { href: '/admin/content/faqs', label: 'FAQs', role: 'superadmin' },
      { href: '/admin/content/settings', label: 'Settings & fees', role: 'superadmin' },
    ],
  },
  {
    label: 'GOVERNANCE',
    entries: [
      { href: '/admin/accounts', label: 'Staff accounts', role: 'superadmin' },
      { href: '/admin/audit', label: 'Audit log', role: 'superadmin' },
    ],
  },
];

const RANK: Record<AdminRole, number> = { oc: 1, admin: 2, superadmin: 3 };

export function ConsoleNav({ role }: { role: AdminRole }) {
  const pathname = usePathname();

  return (
    <nav className="console__nav" aria-label="Operations">
      <div className="console__brand">
        <p className="brand__name">LUMEN MUN</p>
        <p className="brand__sub">OPERATIONS</p>
      </div>

      {SECTIONS.map((section) => {
        const visible = section.entries.filter((e) => RANK[role] >= RANK[e.role]);
        if (!visible.length) return null;

        return (
          <div key={section.label}>
            <p className="console__group">{section.label}</p>
            {visible.map((entry) => {
              const active =
                entry.href === '/admin' ? pathname === '/admin' : pathname.startsWith(entry.href);
              return (
                <Link
                  className="console__link"
                  href={entry.href}
                  key={entry.href}
                  data-active={active ? 'true' : 'false'}
                  aria-current={active ? 'page' : undefined}
                >
                  {entry.label}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
