import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { currentStaff, atLeast } from '@/lib/auth';
import { staffSignOut } from '@/lib/actions/auth';
import { ConsoleNav } from '@/components/admin/ConsoleNav';
import { dbKind } from '@/db';
import '../admin.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Operations', template: '%s · LUMEN MUN Operations' },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // The login page renders inside this layout too, so it must not be guarded.
  const pathname = (await headers()).get('x-pathname') ?? '';
  const staff = await currentStaff();

  if (!staff && !pathname.endsWith('/admin/login')) {
    // Middleware handles the redirect for every other admin route; this is the
    // belt-and-braces check for direct server renders.
    redirect('/admin/login');
  }

  if (!staff) return <>{children}</>;

  return (
    <div className="console">
      <ConsoleNav role={staff.role} />

      <div className="console__main">
        <div className="console__bar">
          <span className="readout">
            {staff.displayName} · {staff.role.toUpperCase()}
            {staff.builtIn ? ' · BUILT-IN' : ''}
          </span>
          <span className="readout" title="Active database driver">
            DB: {dbKind().toUpperCase()}
          </span>
          {atLeast(staff.role, 'admin') && (
            <a className="btn-mini" href="/" target="_blank" rel="noopener">
              View site
            </a>
          )}
          <form action={staffSignOut}>
            <button className="btn-mini" type="submit">
              Sign out
            </button>
          </form>
        </div>

        {children}
      </div>
    </div>
  );
}
