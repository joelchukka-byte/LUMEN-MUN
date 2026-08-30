import Link from 'next/link';
import Image from 'next/image';

const COLUMNS = [
  {
    label: 'Conference',
    links: [
      ['/about', 'About'],
      ['/committees', 'Committees'],
      ['/schedule', 'Schedule'],
      ['/secretariat', 'Secretariat'],
    ],
  },
  {
    label: 'Delegates',
    links: [
      ['/register', 'Registration'],
      ['/forms', 'Forms & documents'],
      ['/faq', 'FAQ'],
      ['/dashboard', 'Dashboard'],
    ],
  },
  {
    label: 'More',
    links: [
      ['/sponsors', 'Sponsors'],
      ['/press', 'Press & gallery'],
      ['/contact', 'Contact'],
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__inner">
          <div>
            <Link className="brand" href="/">
              <Image className="brand__mark" src="/img/crest-hi.webp" alt="" width={30} height={30} />
              <span className="brand__name">LUMEN MUN</span>
            </Link>
            <p className="footer__blurb">
              The inaugural Model United Nations conference of Guntur, Andhra Pradesh. An initiative
              of the Lumen Youth Initiative.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav className="footer__col" aria-label={col.label} key={col.label}>
              <p className="label">{col.label}</p>
              {col.links.map(([href, label]) => (
                <Link className="footer__link" href={href} key={href}>
                  {label}
                </Link>
              ))}
            </nav>
          ))}
        </div>

        <div className="footer__base">
          <span>© {new Date().getFullYear()} LUMEN MUN</span>
          <Link className="footer__link" href="/system">
            Design system
          </Link>
        </div>
      </div>
    </footer>
  );
}
