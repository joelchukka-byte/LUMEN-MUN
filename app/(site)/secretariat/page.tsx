import type { Metadata } from 'next';
import Image from 'next/image';
import { UserIcon } from '@phosphor-icons/react/dist/ssr';
import { getSecretariat, getFounders } from '@/lib/content';
import { Founders } from '@/components/site/Founders';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';

/*
 * Rendered per request rather than prerendered: this page reads from Postgres,
 * and the build container has no route to it. See DEPLOY.md.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Secretariat',
  description:
    'The founders and organising team of LUMEN MUN Edition I: the Secretary-General, the Director-General, and the organisers running the conference.',
};

/** Initials stand in until a portrait is uploaded. Reads as designed, not broken. */
function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length || name === 'To be announced') return null;
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export default async function SecretariatPage() {
  const [people, founders] = await Promise.all([getSecretariat(), getFounders()]);

  // One flat roster in seniority order rather than grouped by department. With
  // twelve people the groups were only a row or two each, which broke the page
  // into fragments instead of reading as a single team.
  const roster = people.filter((p) => !founders.some((f) => f.id === p.id));

  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1 className="h1">Secretariat</h1>
          <p className="lede page-head__lede">
            The {people.length} organisers running Edition I. Names and portraits publish alongside
            the committee announcement.
          </p>
        </div>
      </section>

      <section className="section--sm" style={{ paddingTop: 0 }}>
        <div className="container">
          <Founders people={founders} aside="Edition I" priority />
        </div>
      </section>

      {roster.length > 0 && (
        <section className="section--sm" style={{ paddingTop: 0 }}>
          <div className="container">
            <Reveal>
              <div className="dept__head">
                <h2 className="h2">The team</h2>
                <span className="micro num">
                  {roster.length} {roster.length === 1 ? 'member' : 'members'}
                </span>
              </div>
            </Reveal>

            <RevealGroup className="roster">
              {roster.map((person) => (
                <RevealItem className="person" key={person.id}>
                  <div className="person__portrait">
                    {person.photo ? (
                      <Image src={person.photo} alt={person.name} width={440} height={560} />
                    ) : initials(person.name) ? (
                      <span className="person__initials" aria-hidden="true">
                        {initials(person.name)}
                      </span>
                    ) : (
                      <UserIcon size={28} aria-hidden="true" style={{ color: 'var(--text-4)' }} />
                    )}
                  </div>
                  <div>
                    <p className="person__name">{person.name}</p>
                    <p className="person__role">{person.role}</p>
                    <p className="person__dept">{person.department}</p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>
      )}

      {people.length === 0 && (
        <section className="section--sm" style={{ paddingTop: 0 }}>
          <div className="container">
            <Reveal>
              <div className="empty">
                <h3 className="h4">The secretariat publishes with the announcement</h3>
                <p className="body-sm">Twelve roles across four departments.</p>
              </div>
            </Reveal>
          </div>
        </section>
      )}
    </>
  );
}
