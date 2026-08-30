import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon, CameraIcon } from '@phosphor-icons/react/dist/ssr';
import { getGallery, getContactSettings } from '@/lib/content';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';

/*
 * Rendered per request rather than prerendered: this page reads from Postgres,
 * and the build container has no route to it. See DEPLOY.md.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Press & gallery',
  description: 'Accreditation, interview requests and brand assets for LUMEN MUN Edition I.',
};

type Props = { searchParams: Promise<{ edition?: string }> };

export default async function PressPage({ searchParams }: Props) {
  const [{ edition }, editions, contact] = await Promise.all([
    searchParams,
    getGallery(),
    getContactSettings(),
  ]);

  const active = editions.find((e) => String(e.id) === edition) ?? editions[0];
  const shot = active?.items.filter((i) => i.image) ?? [];

  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1 className="h1">Press room</h1>
          <p className="lede page-head__lede">
            Edition I is our first, so the gallery fills as it happens. Accreditation, interview
            requests and brand assets are handled below.
          </p>
        </div>
      </section>

      <section className="section--sm" style={{ paddingTop: 0 }}>
        <div className="container">
          {editions.length > 1 && (
            <Reveal>
              <div className="tabs" style={{ marginBottom: '2rem' }}>
                {editions.map((ed) => (
                  <Link
                    className="tab"
                    href={`/press?edition=${ed.id}`}
                    key={ed.id}
                    aria-current={ed.id === active?.id ? 'page' : undefined}
                  >
                    {ed.label}
                  </Link>
                ))}
              </div>
            </Reveal>
          )}

          {shot.length > 0 ? (
            <RevealGroup className="gallery">
              {shot.map((item) => (
                <RevealItem
                  className={`gallery__cell${item.span > 1 ? ' gallery__cell--wide' : ''}`}
                  key={item.id}
                >
                  <Image
                    src={item.image!}
                    alt={item.caption}
                    width={item.span > 1 ? 900 : 600}
                    height={item.span > 1 ? 506 : 450}
                  />
                </RevealItem>
              ))}
            </RevealGroup>
          ) : (
            <div className="empty">
              <CameraIcon className="empty__icon" size={26} />
              <h3 className="h4">The gallery fills after Edition I</h3>
              <p className="body-sm">
                Photographs from the floor, the dais and the closing ceremony land here during the
                conference.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="section--sm" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="press-grid">
            <Reveal>
              <article className="press-desk">
                <h2 className="h2">Accreditation &amp; enquiries</h2>
                <p style={{ marginTop: '1rem' }}>
                  Student publications and local media can request accreditation for the conference
                  floor. Interviews with the Secretary-General and dais members are arranged through
                  the Press &amp; Media department.
                </p>

                <dl className="kv" style={{ marginTop: '1.75rem' }}>
                  <div className="kv__row">
                    <dt>Accreditation</dt>
                    <dd>
                      <a className="link" href={`mailto:${contact.press}`}>
                        {contact.press}
                      </a>
                    </dd>
                  </div>
                  <div className="kv__row">
                    <dt>Response time</dt>
                    <dd>Within 48 hours</dd>
                  </div>
                </dl>
              </article>
            </Reveal>

            <Reveal delay={0.08}>
              <article className="card" style={{ padding: 'clamp(24px, 3vw, 32px)' }}>
                <p className="label label--accent">Media kit</p>
                <h3 className="h3" style={{ margin: '0.75rem 0 0.75rem' }}>
                  Logos, palette, fact sheet
                </h3>
                <p className="body-sm">
                  Brand assets and an editable one-pager for outlets covering the conference.
                </p>
                <div style={{ marginTop: '1.75rem' }}>
                  <Link
                    className="btn btn--primary btn--sm btn--block"
                    href="/contact?topic=press"
                  >
                    Request the media kit
                    <ArrowRightIcon size={15} weight="bold" />
                  </Link>
                </div>
              </article>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
