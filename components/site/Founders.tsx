import Image from 'next/image';
import { UserIcon } from '@phosphor-icons/react/dist/ssr';
import type { Founder } from '@/lib/content';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';

/**
 * The two people who head the conference, shown large and side by side.
 *
 * Used on both the home page and the secretariat page, so the pair stays
 * identical in both places and a change to the crop, the treatment or the
 * fallback only has to happen once.
 */

/** Initials stand in until a portrait is uploaded. Reads as designed, not broken. */
function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length || name === 'To be announced') return null;
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function Founders({
  people,
  heading = 'Founders',
  aside,
  /** The home page shows these below the fold; the secretariat page leads with them. */
  priority = false,
}: {
  people: Founder[];
  heading?: string;
  aside?: string;
  priority?: boolean;
}) {
  if (people.length === 0) return null;

  return (
    <>
      <Reveal>
        <div className="dept__head">
          <h2 className="h2">{heading}</h2>
          {aside && <span className="micro">{aside}</span>}
        </div>
      </Reveal>

      <RevealGroup className="founders">
        {people.map((person) => (
          <RevealItem className="founder" key={person.id}>
            <div className="founder__portrait">
              {person.photo ? (
                <Image
                  src={person.photo}
                  alt={person.name}
                  width={1200}
                  height={1500}
                  sizes="(max-width: 640px) 100vw, 50vw"
                  priority={priority}
                />
              ) : initials(person.name) ? (
                <span className="person__initials" aria-hidden="true">
                  {initials(person.name)}
                </span>
              ) : (
                <UserIcon size={34} aria-hidden="true" style={{ color: 'var(--text-4)' }} />
              )}
            </div>
            <div className="founder__body">
              <p className="label label--accent">{person.role}</p>
              <p className="founder__name">{person.name}</p>
              {person.bio && <p className="founder__bio">{person.bio}</p>}
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </>
  );
}
