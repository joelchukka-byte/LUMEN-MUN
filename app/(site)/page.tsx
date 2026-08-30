import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon, ArrowUpRightIcon } from '@phosphor-icons/react/dist/ssr';
import {
  getCommittees,
  getHomeContent,
  getScheduleDays,
  getPricing,
  getRegistrationSettings,
  getFounders,
} from '@/lib/content';
import { imageOr } from '@/lib/image';
import { rupees } from '@/lib/format';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { Opening } from '@/components/site/Opening';
import { Founders } from '@/components/site/Founders';

/*
 * Rendered per request rather than prerendered: this page reads from Postgres,
 * and the build container has no route to it. See DEPLOY.md.
 */
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [home, committees, days, pricing, settings, founders] = await Promise.all([
    getHomeContent(),
    getCommittees(),
    getScheduleDays(),
    getPricing(),
    getRegistrationSettings(),
    getFounders(),
  ]);

  const lead = committees[0];
  const rest = committees.slice(1, 3);

  return (
    <>
      <Opening />

      {/* ── 2. Intro ─────────────────────── the headline, revealed on scroll ── */}
      <section className="intro">
        <div className="container">
          <Reveal>
            <p className="label label--accent">{home.eyebrow}</p>
          </Reveal>

          <Reveal delay={0.06}>
            <h1 className="display intro__title">Take the floor.</h1>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="lede intro__lede">
              The inaugural Model United Nations conference of Guntur, run to a standard first
              editions rarely reach.
            </p>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="hero__actions">
              <Link className="btn btn--primary btn--lg" href="/register">
                Register
                <ArrowRightIcon size={17} weight="bold" />
              </Link>
              <Link className="arrow-link" href="/committees">
                See the committees
                <ArrowRightIcon className="arrow" size={16} weight="bold" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 2. Figures ───────────────────────────────────── hairline strip ── */}
      <section>
        <div className="container">
          <RevealGroup className="figures">
            <RevealItem className="figure">
              <p className="figure__value figure__value--accent num">{settings.seatsCap}</p>
              <p className="figure__label">Delegate seats</p>
              <p className="figure__note">Across every committee</p>
            </RevealItem>
            <RevealItem className="figure">
              <p className="figure__value num">{committees.length}</p>
              <p className="figure__label">Committees</p>
              <p className="figure__note">Security, rights, Indian politics</p>
            </RevealItem>
            <RevealItem className="figure">
              <p className="figure__value num">{days.length}</p>
              <p className="figure__label">Days of debate</p>
              <p className="figure__note">Dates announced shortly</p>
            </RevealItem>
            <RevealItem className="figure">
              <p className="figure__value num">{rupees(pricing.baseAmount)}</p>
              <p className="figure__label">Delegate fee</p>
              <p className="figure__note">Kit, meals and socials included</p>
            </RevealItem>
          </RevealGroup>
        </div>
      </section>

      {/* ── 3. Founders ────────────────────────────── the two who lead it ── */}
      <section className="section--sm">
        <div className="container">
          <Founders people={founders} aside="Edition I" />
        </div>
      </section>

      {/* ── 3. Statement ──────────────────────────── editorial manifesto ── */}
      <section className="section">
        <div className="container">
          <Reveal>
            <p className="statement">A first edition, held to a national standard.</p>
          </Reveal>

          <RevealGroup className="statement-support">
            {(home.pillars ?? []).map((pillar) => (
              <RevealItem key={pillar.num}>
                <h3 className="h4">{pillar.title}</h3>
                <p>{pillar.body}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── 4. Committees ─────────────────────────────── asymmetric grid ── */}
      <section className="section--sm">
        <div className="container">
          <Reveal className="section-head">
            <div>
              <p className="label label--accent">Committees</p>
              <h2 className="h2 section-head__title" style={{ marginTop: '0.75rem' }}>
                Three councils, one floor each.
              </h2>
            </div>
            <Link className="arrow-link" href="/committees">
              All committees
              <ArrowRightIcon className="arrow" size={16} weight="bold" />
            </Link>
          </Reveal>

          <RevealGroup className="committee-grid">
            {lead && (
              <RevealItem as="div" className="committee-grid__lead">
                <Link className="card" href={`/committees/${lead.slug}`}>
                  <div className="card__media">
                    <Image
                      src={imageOr(lead.image, lead.slug)}
                      alt=""
                      width={1400}
                      height={600}
                    />
                  </div>
                  <div className="card__body">
                    <div className="committee-card__meta">
                      <span className="chip">{lead.level}</span>
                      {lead.seats > 0 && <span className="micro num">{lead.seats} seats</span>}
                    </div>
                    <h3 className="h3 committee-card__title">{lead.name}</h3>
                    <p className="body-sm">{lead.blurb}</p>
                    <div className="committee-card__foot">
                      <span>
                        {lead.agendaStatus === 'released' ? lead.agendaTitle : 'Agenda under embargo'}
                      </span>
                      <ArrowUpRightIcon size={15} />
                    </div>
                  </div>
                </Link>
              </RevealItem>
            )}

            {rest.map((c) => (
              <RevealItem as="div" key={c.id}>
                <Link className="card" href={`/committees/${c.slug}`}>
                  <div className="card__media">
                    <Image src={imageOr(c.image, c.slug)} alt="" width={700} height={440} />
                  </div>
                  <div className="card__body">
                    <div className="committee-card__meta">
                      <span className="chip">{c.level}</span>
                    </div>
                    <h3 className="h3 committee-card__title">{c.name}</h3>
                    <p className="body-sm">{c.blurb}</p>
                    <div className="committee-card__foot">
                      <span>
                        {c.agendaStatus === 'released' ? c.agendaTitle : 'Agenda under embargo'}
                      </span>
                      <ArrowUpRightIcon size={15} />
                    </div>
                  </div>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── 5. Days ──────────────────────────────────────── timeline strip ── */}
      <section className="section">
        <div className="container">
          <Reveal className="section-head">
            <h2 className="h2 section-head__title">Three days, start to gavel.</h2>
            <Link className="arrow-link" href="/schedule">
              Full schedule
              <ArrowRightIcon className="arrow" size={16} weight="bold" />
            </Link>
          </Reveal>

          <RevealGroup className="days">
            {days.map((day, i) => (
              <RevealItem className="day-cell" key={day.id}>
                <p className="day-cell__index num">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="h3 day-cell__title">{day.title}</h3>
                <p className="day-cell__note">{day.note}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── 6. What a seat includes ───────────────────────────────── bento ── */}
      <section className="section--sm">
        <div className="container">
          <Reveal>
            <h2 className="h2" style={{ maxWidth: '18ch', marginBottom: 'clamp(32px, 4vw, 48px)' }}>
              What a seat includes.
            </h2>
          </Reveal>

          <RevealGroup className="bento">
            <RevealItem className="bento__cell bento__cell--media bento__cell--wide">
              <Image
                src={imageOr(null, 'assembly-floor')}
                alt="Delegates in session"
                width={1200}
                height={800}
              />
              <div className="bento__caption">
                <h3 className="h3">Three days on a real committee floor</h3>
                <p>UNA-USA procedure, trained chairs, and a dais briefed before day one.</p>
              </div>
            </RevealItem>

            <RevealItem className="bento__cell bento__cell--accent">
              <p className="bento__figure num">{rupees(pricing.baseAmount)}</p>
              <p>One flat rate for individual delegates and school delegations alike.</p>
            </RevealItem>

            <RevealItem className="bento__cell">
              <h3 className="h4">Delegate kit</h3>
              <p>Placard, handbook, background guide and certificate.</p>
            </RevealItem>

            <RevealItem className="bento__cell">
              <h3 className="h4">Lunch and refreshments</h3>
              <p>All three days, plus the delegate social and closing ceremony.</p>
            </RevealItem>

            <RevealItem className="bento__cell bento__cell--wide">
              <h3 className="h4">Training before you arrive</h3>
              <p>
                Every registered delegate gets an online session on procedure, speech structure and
                resolution writing. First-timers are expected, not tolerated.
              </p>
            </RevealItem>
          </RevealGroup>
        </div>
      </section>

      {/* ── 7. Close ─────────────────────────────────── full-bleed statement ── */}
      <section className="cta-band">
        <div className="container">
          <div className="cta-band__inner">
            <Reveal>
              <h2 className="h1 cta-band__title">Seats are allocated first-come.</h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="lede" style={{ margin: '0 auto' }}>
                Register now and your committee preferences are read before the general queue.
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
