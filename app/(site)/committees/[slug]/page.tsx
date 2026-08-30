import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  FilePdfIcon,
  LockSimpleIcon,
  UserIcon,
} from '@phosphor-icons/react/dist/ssr';
import { getCommittee, getCommitteeDocuments } from '@/lib/content';
import { currentDelegate } from '@/lib/auth';
import { imageOr } from '@/lib/image';
import { Reveal } from '@/components/ui/Reveal';

/*
 * Rendered per request rather than prerendered: this page reads from Postgres,
 * and the build container has no route to it. See DEPLOY.md.
 */
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const committee = await getCommittee(slug);
  if (!committee) return { title: 'Committee not found' };
  return { title: committee.name, description: committee.blurb };
}

export default async function CommitteePage({ params }: Props) {
  const { slug } = await params;
  const committee = await getCommittee(slug);
  if (!committee) notFound();

  const [docs, delegate] = await Promise.all([
    getCommitteeDocuments(committee.id),
    currentDelegate(),
  ]);

  const allocatedHere =
    delegate?.assignedCommittee === committee.slug ||
    delegate?.assignedCommittee === committee.name;

  const dais = [
    {
      role: committee.chairRole ?? 'Chairperson',
      name: committee.chairName ?? 'To be announced',
      bio: committee.chairBio,
      photo: committee.chairPhoto,
    },
    {
      role: committee.viceChairRole ?? 'Vice-Chair',
      name: committee.viceChairName ?? 'To be announced',
      bio: committee.viceChairBio,
      photo: committee.viceChairPhoto,
    },
  ];

  const released = committee.agendaStatus === 'released';

  return (
    <>
      <section className="page-head">
        <div className="container">
          <p className="breadcrumb">
            <Link href="/committees">
              <ArrowLeftIcon size={14} /> Committees
            </Link>
          </p>

          <div className="detail-hero">
            <div>
              <h1 className="h1">{committee.name}</h1>

              <div className="committee-card__meta" style={{ margin: '1.5rem 0' }}>
                <span className="chip">{committee.level}</span>
                <span className="chip">{committee.code}</span>
                {committee.seats > 0 && <span className="chip num">{committee.seats} seats</span>}
              </div>

              <p className="lede">{committee.blurb}</p>

              {committee.overview && (
                <div className="body" style={{ marginTop: '1.75rem', display: 'grid', gap: '1rem' }}>
                  {committee.overview.split(/\n{2,}/).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '2.25rem' }}>
                <Link className="btn btn--primary" href={`/register?committee=${committee.slug}`}>
                  Register for this committee
                  <ArrowRightIcon size={16} weight="bold" />
                </Link>
              </div>
            </div>

            <div className="detail-hero__media">
              <Image
                src={imageOr(committee.image, committee.slug)}
                alt=""
                width={800}
                height={600}
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Agenda */}
      <section className="section--sm" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal>
            <div className="agenda" data-status={committee.agendaStatus}>
              <p className="label label--accent">Agenda</p>
              <h2 className="h3 agenda__title">
                {released && committee.agendaTitle ? committee.agendaTitle : 'Classified'}
              </h2>

              {released ? (
                committee.agendaItems.length > 0 && (
                  <ol className="agenda__items">
                    {committee.agendaItems.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ol>
                )
              ) : (
                <p className="body-sm" style={{ marginTop: '0.875rem' }}>
                  The agenda and its sub-topics publish with the conference announcement. Registered
                  delegates are emailed the moment it lifts, ahead of the public release.
                </p>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Dais */}
      <section className="section--sm" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal>
            <h2 className="h2" style={{ marginBottom: 'clamp(24px, 3vw, 36px)' }}>
              The dais
            </h2>
          </Reveal>

          <div className="dais">
            {dais.map((person) => (
              <Reveal key={person.role}>
                <article className="dais__card">
                  <div className="dais__photo">
                    {person.photo ? (
                      <Image src={person.photo} alt={person.name} width={200} height={200} />
                    ) : (
                      <UserIcon size={22} />
                    )}
                  </div>
                  <div>
                    <p className="label">{person.role}</p>
                    <p className="h4" style={{ marginTop: '0.375rem' }}>
                      {person.name}
                    </p>
                    {person.bio && <p className="dais__bio">{person.bio}</p>}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="section--sm" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal>
            <div className="section-head">
              <h2 className="h2 section-head__title">Background guide</h2>
              <span className="micro">
                {allocatedHere ? 'Available to you' : 'Released to allocated delegates'}
              </span>
            </div>
          </Reveal>

          {docs.length === 0 ? (
            <div className="empty">
              <FilePdfIcon className="empty__icon" size={26} />
              <h3 className="h4">The guide publishes with the agenda</h3>
              <p className="body-sm">
                Registered delegates get it by email and on their dashboard the day it lands.
              </p>
            </div>
          ) : (
            <div className="docs">
              {docs.map((doc) =>
                allocatedHere ? (
                  <a className="doc" href={doc.file} key={doc.id} target="_blank" rel="noopener">
                    <FilePdfIcon className="doc__icon" size={22} />
                    <span>
                      <span className="doc__title">{doc.title}</span>
                      <span className="doc__meta">
                        {doc.kind.replace('_', ' ')}
                        {doc.sizeBytes ? ` · ${Math.round(doc.sizeBytes / 1024)} KB` : ''}
                      </span>
                    </span>
                    <span className="doc__action">Download</span>
                  </a>
                ) : (
                  <div className="doc" data-locked="true" key={doc.id}>
                    <LockSimpleIcon className="doc__icon" size={22} />
                    <span>
                      <span className="doc__title">{doc.title}</span>
                      <span className="doc__meta">Allocated delegates only</span>
                    </span>
                    <span className="doc__action">Locked</span>
                  </div>
                )
              )}
            </div>
          )}

          {!delegate && docs.length > 0 && (
            <p className="notice" data-tone="accent" style={{ marginTop: '1.25rem' }}>
              <LockSimpleIcon className="notice__icon" size={18} />
              <span>
                <Link className="link" href="/login">
                  Sign in
                </Link>{' '}
                with your delegate account to download the guide for the committee you were
                allocated.
              </span>
            </p>
          )}
        </div>
      </section>
    </>
  );
}
