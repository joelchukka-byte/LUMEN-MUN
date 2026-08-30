import Link from 'next/link';
import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <main id="main" className="auth">
      <div style={{ textAlign: 'center', maxWidth: '38rem' }}>
        <p className="label label--accent">404</p>
        <h1 className="h1" style={{ marginTop: '1.25rem' }}>
          Off the speakers list.
        </h1>
        <p className="lede" style={{ margin: '1.5rem auto 0' }}>
          That page does not exist. It may have moved with the conference announcement, or the link
          may be mistyped.
        </p>
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: '2.5rem',
          }}
        >
          <Link className="btn btn--primary" href="/">
            Back to the conference
            <ArrowRightIcon size={16} weight="bold" />
          </Link>
          <Link className="btn btn--ghost" href="/committees">
            See committees
          </Link>
        </div>
      </div>
    </main>
  );
}
