import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr';
import { getScheduleDays } from '@/lib/content';
import { Reveal } from '@/components/ui/Reveal';

/*
 * Rendered per request rather than prerendered: this page reads from Postgres,
 * and the build container has no route to it. See DEPLOY.md.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Schedule',
  description: 'Three days of committee sessions, ceremonies and socials at LUMEN MUN Edition I.',
};

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
}

function timeRange(start: string | null, end: string | null) {
  if (!start) return 'Time to be announced';
  return end ? `${start} - ${end}` : start;
}

export default async function SchedulePage() {
  const days = await getScheduleDays();
  const anyDated = days.some((d) => d.date);

  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="page-head__row">
            <h1 className="h1">Schedule</h1>
            {!anyDated && <span className="chip chip--accent">Calendar dates to be announced</span>}
          </div>
          <p className="lede page-head__lede">
            Three days of committee sessions with an opening and closing ceremony. Session timings
            publish with the conference announcement; registered delegates get the timed run of show
            by email before day one.
          </p>
        </div>
      </section>

      <section className="section--sm" style={{ paddingTop: 0 }}>
        <div className="container">
          {days.map((day) => (
            <Reveal key={day.id}>
              <section className="schedule-day">
                <div className="schedule-day__head">
                  <div>
                    <p className="label label--accent">{day.label}</p>
                    <p className="micro" style={{ marginTop: '0.5rem' }}>
                      {formatDate(day.date) ?? 'Date to be announced'}
                    </p>
                  </div>
                  <div>
                    <h2 className="h2">{day.title}</h2>
                    {day.note && (
                      <p className="body" style={{ marginTop: '0.875rem' }}>
                        {day.note}
                      </p>
                    )}
                  </div>
                </div>

                {day.sessions.length > 0 ? (
                  <div>
                    {day.sessions.map((session) => (
                      <div className="session" data-kind={session.kind} key={session.id}>
                        <p className="session__time num">
                          {timeRange(session.startsAt, session.endsAt)}
                        </p>
                        <div>
                          <p className="session__title">{session.title}</p>
                          {session.detail && <p className="session__meta">{session.detail}</p>}
                          {session.venue && <p className="session__meta">{session.venue}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="notice">
                    <span>
                      The session plan for this day publishes with the conference announcement.
                    </span>
                  </p>
                )}
              </section>
            </Reveal>
          ))}

          {days.length === 0 && (
            <div className="empty">
              <h3 className="h4">The schedule publishes with the announcement</h3>
              <p className="body-sm">Three days, opening ceremony through to awards.</p>
            </div>
          )}
        </div>
      </section>

      <section className="cta-band">
        <div className="container">
          <div className="cta-band__inner">
            <Reveal>
              <h2 className="h2 cta-band__title">Hear the dates first.</h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="lede" style={{ margin: '0 auto' }}>
                Registered delegates are emailed the timed schedule and room allocations before the
                public announcement.
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
