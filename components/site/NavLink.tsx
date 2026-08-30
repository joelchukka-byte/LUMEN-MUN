'use client';

import Link from 'next/link';
import { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps, ReactNode } from 'react';

/**
 * A link that tells you it is working.
 *
 * Next prefetches most routes, so navigation is usually instant and nothing
 * shows. When a route does have to wait on the database, `useLinkStatus` flips
 * to pending and the link picks up a moving underline — the animation exists to
 * report state, not to decorate.
 */
function PendingMark() {
  const { pending } = useLinkStatus();
  return pending ? <span className="link-pending" aria-hidden="true" /> : null;
}

type NavLinkProps = ComponentProps<typeof Link> & {
  children: ReactNode;
  /** Also mark active when the current path is nested under href. */
  nested?: boolean;
  activeClassName?: string;
};

export function NavLink({
  children,
  nested = false,
  activeClassName,
  className,
  ...props
}: NavLinkProps) {
  const pathname = usePathname();
  const href = typeof props.href === 'string' ? props.href : props.href.pathname || '';

  const isActive =
    href === '/' ? pathname === '/' : nested ? pathname.startsWith(href) : pathname === href;

  return (
    <Link
      {...props}
      className={[className, isActive && activeClassName].filter(Boolean).join(' ') || undefined}
      data-active={isActive ? 'true' : 'false'}
      aria-current={isActive ? 'page' : undefined}
    >
      {children}
      <PendingMark />
    </Link>
  );
}

/** Reports whether any descendant link is mid-navigation. */
export function usePending() {
  return useLinkStatus().pending;
}
