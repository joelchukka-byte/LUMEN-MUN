import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr';
import { getCommittees } from '@/lib/content';
import { imageOr } from '@/lib/image';
import { Reveal } from '@/components/ui/Reveal';

/*
 * Rendered per request rather than prerendered: this page reads from Postgres,
 * and the build container has no route to it. See DEPLOY.md.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Committees',
  description:
    'The councils of LUMEN MUN Edition I: levels, dais, agendas and background guides.',
};

export default async function CommitteesPage() {
  const committees = await getCommittees();
  const embargoed = committees.filter((c) => c.agendaStatus !== 'released').length;

  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="page-head__row">
            <h1 className="h1">Committees</h1>
            {embargoed > 0 && <span className="chip chip--accent">Agendas under embargo</span>}
          </div>
          <p className="lede page-head__lede">
            Two UN bodies, a state assembly, a press corps, and two committees you will not find
            at another conference. Study guides drop with the agenda announcement; allocations
            follow within a week of registration close.
          </p>
        </div>
      </section>

      <section className="section--sm" style={{ paddingTop: 0 }}>
        <div className="container">
          {committees.map((c, i) => (
            <Reveal key={c.id}>
              <article className="committee-row">
                <div className="committee-row__media">
                  <Image
                    src={imageOr(c.image, c.slug)}
                    alt=""
                    width={800}
                    height={600}
                    loading={i === 0 ? 'eager' : 'lazy'}
                  />
                </div>

                <div>
                  <p className="committee-row__index num">
                    {String(i + 1).padStart(2, '0')} / {String(committees.length).padStart(2, '0')}
                  </p>

                  <h2 className="h2" style={{ margin: '0.75rem 0 1rem' }}>
                    <Link href={`/committees/${c.slug}`}>{c.name}</Link>
                  </h2>

                  <div className="committee-card__meta" style={{ marginBottom: '1.25rem' }}>
                    <span className="chip">{c.code}</span>
                  </div>

                  <p className="body">{c.blurb}</p>

                  <dl className="kv" style={{ marginTop: '1.75rem' }}>
                    <div className="kv__row">
                      <dt>Agenda</dt>
                      <dd style={{ color: c.agendaStatus === 'released' ? 'var(--accent)' : undefined }}>
                        {c.agendaStatus === 'released' && c.agendaTitle
                          ? c.agendaTitle
                          : 'Classified until the announcement'}
                      </dd>
                    </div>
                    <div className="kv__row">
                      <dt>{c.chairRole ?? 'Chair'}</dt>
                      <dd>{c.chairName ?? 'To be announced'}</dd>
                    </div>
                  </dl>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '2rem' }}>
                    <Link className="btn btn--primary btn--sm" href={`/register?committee=${c.slug}`}>
                      Register for this committee
                    </Link>
                    <Link className="btn btn--ghost btn--sm" href={`/committees/${c.slug}`}>
                      Read the brief
                      <ArrowRightIcon size={15} weight="bold" />
                    </Link>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}

          {committees.length === 0 && (
            <div className="empty">
              <h3 className="h4">Committees publish with the conference announcement</h3>
              <p className="body-sm">Register your interest and you will hear first.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
