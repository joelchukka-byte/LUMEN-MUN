import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon, CheckIcon } from '@phosphor-icons/react/dist/ssr';
import { getSponsors, getRegistrationSettings } from '@/lib/content';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Sponsors & partners',
  description: 'Partner with LUMEN MUN Edition I. Tiers, reach and what each level includes.',
};

export default async function SponsorsPage() {
  const [sponsors, settings] = await Promise.all([getSponsors(), getRegistrationSettings()]);

  const tiers = sponsors.filter((s) => !s.confirmed);
  const confirmed = sponsors.filter((s) => s.confirmed);

  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1 className="h1">Partner with Edition I</h1>
          <p className="lede page-head__lede">
            {settings.seatsCap} delegates, forty organisers and their families across Guntur&rsquo;s
            schools, with year-round visibility through the Lumen Youth Initiative.
          </p>
        </div>
      </section>

      <section className="section--sm" style={{ paddingTop: 0 }}>
        <div className="container">
          <RevealGroup className="tiers">
            {tiers.map((tier, i) => (
              <RevealItem key={tier.id}>
                <article className={`card tier${i === 0 ? ' tier--lead' : ''}`}>
                  <p className={`label${i === 0 ? ' label--accent' : ''}`}>{tier.tier}</p>
                  <h2 className="h3">{tier.name}</h2>
                  {tier.price && <p className="tier__price">{tier.price}</p>}
                  {tier.blurb && <p className="body-sm">{tier.blurb}</p>}

                  {tier.perks.length > 0 && (
                    <ul className="tier__perks">
                      {tier.perks.map((perk) => (
                        <li key={perk}>
                          <CheckIcon size={14} weight="bold" />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="tier__action">
                    <Link
                      className={`btn btn--sm btn--block ${i === 0 ? 'btn--primary' : 'btn--ghost'}`}
                      href="/contact?topic=sponsorship"
                    >
                      Enquire
                    </Link>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>

          {tiers.length === 0 && (
            <div className="empty">
              <h3 className="h4">Partnership tiers publish shortly</h3>
              <p className="body-sm">
                <Link className="link" href="/contact?topic=sponsorship">
                  Write to the sponsorship desk
                </Link>{' '}
                and we will send the deck directly.
              </p>
            </div>
          )}
        </div>
      </section>

      {confirmed.length > 0 && (
        <section className="section--sm" style={{ paddingTop: 0 }}>
          <div className="container">
            <Reveal>
              <div className="section-head">
                <h2 className="h2 section-head__title">In conversation with</h2>
              </div>
            </Reveal>

            <Reveal>
              <div className="logo-wall">
                {confirmed.map((sponsor) =>
                  sponsor.logo ? (
                    <a
                      className="logo-slot"
                      href={sponsor.url ?? '#'}
                      key={sponsor.id}
                      target={sponsor.url ? '_blank' : undefined}
                      rel={sponsor.url ? 'noopener' : undefined}
                    >
                      <Image src={sponsor.logo} alt={sponsor.name} width={160} height={90} />
                    </a>
                  ) : (
                    <span className="logo-slot" key={sponsor.id}>
                      {sponsor.name}
                    </span>
                  )
                )}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      <section className="cta-band">
        <div className="container">
          <div className="cta-band__inner">
            <Reveal>
              <h2 className="h2 cta-band__title">Back a first edition.</h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="lede" style={{ margin: '0 auto' }}>
                Tell us what you want out of it and the sponsorship desk will build the package
                around that.
              </p>
            </Reveal>
            <Reveal delay={0.16}>
              <Link className="btn btn--primary btn--lg" href="/contact?topic=sponsorship">
                Talk to the sponsorship desk
                <ArrowRightIcon size={17} weight="bold" />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
