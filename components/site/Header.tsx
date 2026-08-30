'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { CaretDownIcon, ListIcon, XIcon } from '@phosphor-icons/react';
import { NavLink } from './NavLink';

/**
 * Five top-level destinations plus one grouped menu and the primary action.
 * That is the most that fits on one line at 1024px without shrinking labels,
 * which is the constraint the nav is designed around.
 */
const PRIMARY = [
  { href: '/committees', label: 'Committees' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/secretariat', label: 'Secretariat' },
  { href: '/about', label: 'About' },
] as const;

const DELEGATE_MENU = [
  { href: '/register', label: 'Registration', hint: 'Apply for a seat' },
  { href: '/forms', label: 'Forms & documents', hint: 'Read before you pay' },
  { href: '/faq', label: 'FAQ', hint: 'Fees, allocation, logistics' },
  { href: '/dashboard', label: 'Delegate dashboard', hint: 'Track your seat' },
] as const;

const MORE = [
  { href: '/sponsors', label: 'Sponsors & partners' },
  { href: '/press', label: 'Press & gallery' },
  { href: '/contact', label: 'Contact' },
] as const;

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);

  // Adjust during render rather than in an effect, so the menu is never
  // painted open on the new route.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
    setMenu(null);
  }

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      setMenu(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  /**
   * The home page opens on a full-viewport crest with nothing over it, so the
   * header stays out until the reader scrolls. The sentinel sits 10px down, so
   * that is the first flick of the wheel rather than a whole screen later.
   * Every other route renders the header immediately, which is why the initial
   * value is derived from the path: server and client agree, and there is no
   * flash of a header that then disappears.
   *
   * The toggle writes the attribute straight to the node instead of going
   * through state. It is purely visual, it can fire on any scroll crossing, and
   * re-rendering the whole nav for it would be wasted work. An
   * IntersectionObserver on a sentinel does the watching, so nothing runs on
   * the scroll thread.
   */
  const isHome = pathname === '/';
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const sentinel = document.getElementById('scroll-sentinel');
    if (!sentinel) {
      header.dataset.visible = 'true';
      return;
    }

    header.dataset.visible = 'false';
    const observer = new IntersectionObserver(
      ([entry]) => {
        header.dataset.visible = String(entry.boundingClientRect.top <= 0);
      },
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [pathname]);

  const groupActive = (items: readonly { href: string }[]) =>
    items.some((i) => pathname.startsWith(i.href));

  return (
    <>
      <header className="header" data-visible={!isHome} ref={headerRef}>
        <div className="header__inner">
          <Link className="brand" href="/">
            <Image className="brand__mark" src="/img/crest-hi.webp" alt="" width={30} height={30} />
            <span className="brand__name">LUMEN MUN</span>
          </Link>

          <nav className="nav" aria-label="Primary">
            {PRIMARY.map((item) => (
              <NavLink className="nav__link" href={item.href} key={item.href} nested>
                {item.label}
              </NavLink>
            ))}

            {(
              [
                ['delegates', 'Delegates', DELEGATE_MENU],
                ['more', 'More', MORE],
              ] as const
            ).map(([id, label, items]) => (
              <div
                className="nav__group"
                data-open={menu === id}
                key={id}
                onPointerEnter={(e) => e.pointerType !== 'touch' && setMenu(id)}
                onPointerLeave={(e) => e.pointerType !== 'touch' && setMenu(null)}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setMenu(null);
                }}
              >
                <button
                  type="button"
                  className="nav__trigger"
                  aria-expanded={menu === id}
                  aria-haspopup="true"
                  data-active={groupActive(items)}
                  onClick={() => setMenu((cur) => (cur === id ? null : id))}
                >
                  {label}
                  <CaretDownIcon className="nav__caret" size={13} weight="bold" />
                </button>

                <div className="nav__menu">
                  {items.map((item) => (
                    <NavLink className="nav__item" href={item.href} key={item.href} nested>
                      {item.label}
                      {'hint' in item && item.hint ? <span>{item.hint}</span> : null}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}

            <Link className="btn btn--primary btn--sm nav__cta" href="/register">
              Register
            </Link>
          </nav>

          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <XIcon size={18} /> : <ListIcon size={18} />}
          </button>
        </div>
      </header>

      <div className="mobile-nav" id="mobile-nav" data-open={open}>
        <nav aria-label="Mobile">
          {PRIMARY.map((item) => (
            <NavLink className="mobile-nav__link" href={item.href} key={item.href} nested>
              {item.label}
            </NavLink>
          ))}

          <p className="label mobile-nav__group-label">Delegates</p>
          {DELEGATE_MENU.map((item) => (
            <NavLink className="mobile-nav__link" href={item.href} key={item.href} nested>
              {item.label}
            </NavLink>
          ))}

          <p className="label mobile-nav__group-label">More</p>
          {MORE.map((item) => (
            <NavLink className="mobile-nav__link" href={item.href} key={item.href} nested>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Link className="btn btn--primary btn--lg btn--block mobile-nav__cta" href="/register">
          Register
        </Link>
      </div>
    </>
  );
}
