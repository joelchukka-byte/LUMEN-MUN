import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr';
import { getRegistrationSettings, getCommittees } from '@/lib/content';
import { placeholderImage } from '@/lib/image';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'About',
  description:
    'LUMEN MUN is the inaugural Model United Nations conference of Guntur, founded by students who believe a first edition can still be held to a national standard.',
};

const FACTS = [
  ['Format', 'UNA-USA procedure'],
  ['Duration', 'Three days'],
  ['Eligibility', 'Grades 8 to 12, and undergraduates'],
  ['Language', 'English'],
] as const;

const BODIES = [
  {
    name: 'Lumen Youth Initiative',
    body: 'A student-led organisation running debate, public-speaking and policy programmes across Guntur schools.',
  },
  {
    name: 'Faculty advisory',
    body: 'Oversight on safeguarding, academic content and delegate welfare from partner-school faculty.',
  },
  {
    name: 'Secretariat',
    body: 'Twelve organisers across four departments, responsible for running the conference floor.',
  },
] as const;

export default async function AboutPage() {
  const [settings, committees] = await Promise.all([getRegistrationSettings(), getCommittees()]);

  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1 className="h1" style={{ maxWidth: '16ch' }}>
            Diplomacy, taught by <em>doing it properly</em>.
          </h1>
          <p className="lede page-head__lede">
            LUMEN MUN is the inaugural Model United Nations conference of Guntur, founded by students
            who believe a first edition can still be held to a national standard.
          </p>
        </div>
      </section>

      {/* Mission and vision, as a pair of statements rather than cards. */}
      <section className="section--sm" style={{ paddingTop: 0 }}>
        <div className="container">
          <RevealGroup className="statement-support" as="div">
            <RevealItem>
              <p className="label label--accent">Mission</p>
              <p className="h3" style={{ marginTop: '1rem', fontWeight: 500 }}>
                A committee floor where research is rewarded, procedure is respected, and the debate
                actually goes somewhere.
              </p>
            </RevealItem>
            <RevealItem>
              <p className="label">Vision</p>
              <p className="h3" style={{ marginTop: '1rem', fontWeight: 500 }}>
                Guntur as a fixture on the South Indian circuit within three editions, with a
                delegate pipeline that does not need to travel to be taken seriously.
              </p>
            </RevealItem>
          </RevealGroup>
        </div>
      </section>

      {/* What MUN is: prose against a photograph. */}
      <section className="section">
        <div className="container">
          <div className="detail-hero">
            <div>
              <Reveal>
                <h2 className="h2">What Model UN actually is</h2>
              </Reveal>
              <Reveal delay={0.06}>
                <div className="body" style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
                  <p>
                    Delegates are assigned a country or character and must argue its position, not
                    their own, through formal debate governed by parliamentary procedure. Caucuses,
                    working papers, draft resolutions, amendments, votes.
                  </p>
                  <p>
                    What delegates actually leave with: the ability to hold a room, negotiate against
                    interest, write under pressure, and read a brief faster than they thought
                    possible.
                  </p>
                </div>
              </Reveal>

              <Reveal delay={0.12}>
                <dl className="kv" style={{ marginTop: '2.25rem' }}>
                  {FACTS.map(([term, value]) => (
                    <div className="kv__row" key={term}>
                      <dt>{term}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>

            <Reveal delay={0.1}>
              <div className="detail-hero__media">
                <Image
                  src={placeholderImage('assembly-floor')}
                  alt="Delegates on the committee floor"
                  width={900}
                  height={675}
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Who runs it. */}
      <section className="section--sm" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal>
            <div className="section-head">
              <h2 className="h2 section-head__title">Who runs it</h2>
              <Link className="arrow-link" href="/secretariat">
                Meet the secretariat
                <ArrowRightIcon className="arrow" size={16} weight="bold" />
              </Link>
            </div>
          </Reveal>

          <RevealGroup className="statement-support" as="div">
            {BODIES.map((body) => (
              <RevealItem key={body.name}>
                <h3 className="h4">{body.name}</h3>
                <p>{body.body}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section className="cta-band">
        <div className="container">
          <div className="cta-band__inner">
            <Reveal>
              <h2 className="h2 cta-band__title">
                {settings.seatsCap} seats. {committees.length} committees.
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="lede" style={{ margin: '0 auto' }}>
                Allocation runs first-come, and school delegations are capped per committee.
              </p>
            </Reveal>
            <Reveal delay={0.16}>
              <Link className="btn btn--primary btn--lg" href="/register">
                Register
                <ArrowRightIcon size={17} weight="bold" />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
