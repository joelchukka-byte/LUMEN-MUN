import type { Metadata } from 'next';
import { EnvelopeSimpleIcon, MapPinIcon } from '@phosphor-icons/react/dist/ssr';
import { getContactSettings } from '@/lib/content';
import { ContactForm } from '@/components/site/ContactForm';
import { Reveal } from '@/components/ui/Reveal';

/*
 * Rendered per request rather than prerendered: this page reads from Postgres,
 * and the build container has no route to it. See DEPLOY.md.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Reach Delegate Affairs, the sponsorship desk or the press desk at LUMEN MUN.',
};

const TOPIC_BY_KEY: Record<string, string> = {
  registration: 'Delegate registration',
  school: 'School delegation',
  sponsorship: 'Sponsorship & partnerships',
  press: 'Press & media',
};

type Props = { searchParams: Promise<{ topic?: string }> };

export default async function ContactPage({ searchParams }: Props) {
  const [{ topic }, contact] = await Promise.all([searchParams, getContactSettings()]);

  const desks = [
    ['Delegate Affairs', contact.delegates, 'Registration, allocation and logistics'],
    ['Sponsorship', contact.partners, 'Partnership tiers and proposals'],
    ['Press', contact.press, 'Accreditation and interviews'],
  ] as const;

  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1 className="h1">Get in touch</h1>
          <p className="lede page-head__lede">
            Delegate Affairs answers within one working day. For anything time-sensitive during the
            conference, use the desk email directly.
          </p>
        </div>
      </section>

      <section className="section--sm" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="reg-grid">
            <Reveal>
              <div className="card" style={{ padding: 'clamp(24px, 3.4vw, 40px)' }}>
                <h2 className="h3" style={{ marginBottom: '1.5rem' }}>
                  Send a message
                </h2>
                <ContactForm defaultTopic={topic ? TOPIC_BY_KEY[topic] : undefined} />
              </div>
            </Reveal>

            <div style={{ display: 'grid', gap: '20px' }}>
              <Reveal delay={0.08}>
                <div className="card" style={{ padding: 'clamp(20px, 2.6vw, 28px)' }}>
                  <p className="label label--accent">Direct</p>
                  <dl className="kv" style={{ marginTop: '1.25rem' }}>
                    {desks.map(([name, email, note]) => (
                      <div key={name}>
                        <dt className="micro">{name}</dt>
                        <dd style={{ marginTop: '0.25rem' }}>
                          <a className="link" href={`mailto:${email}`}>
                            {email}
                          </a>
                        </dd>
                        <dd className="micro" style={{ marginTop: '0.25rem' }}>
                          {note}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </Reveal>

              <Reveal delay={0.14}>
                <div className="card" style={{ padding: 'clamp(20px, 2.6vw, 28px)' }}>
                  <p className="label label--accent">Venue</p>
                  <p className="h4" style={{ marginTop: '1rem', display: 'flex', gap: '0.625rem' }}>
                    <MapPinIcon size={18} style={{ marginTop: '2px', color: 'var(--text-3)' }} />
                    Guntur, Andhra Pradesh
                  </p>
                  <p className="micro" style={{ marginTop: '0.5rem' }}>
                    The exact venue publishes with the conference announcement.
                  </p>
                </div>
              </Reveal>

              {contact.socials?.length > 0 && (
                <Reveal delay={0.2}>
                  <div className="card" style={{ padding: 'clamp(20px, 2.6vw, 28px)' }}>
                    <p className="label label--accent">Socials</p>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        marginTop: '1.25rem',
                      }}
                    >
                      {contact.socials.map((social) => (
                        <a
                          className="chip"
                          href={social.url}
                          key={social.label}
                          target="_blank"
                          rel="noopener"
                        >
                          {social.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </Reveal>
              )}

              <Reveal delay={0.26}>
                <p className="notice">
                  <EnvelopeSimpleIcon className="notice__icon" size={18} />
                  <span>
                    Already registered? Your reference and payment status live on your{' '}
                    <a className="link" href="/dashboard">
                      delegate dashboard
                    </a>
                    .
                  </span>
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
