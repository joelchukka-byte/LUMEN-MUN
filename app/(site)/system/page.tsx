import type { Metadata } from 'next';
import { CheckIcon } from '@phosphor-icons/react/dist/ssr';
import { Reveal } from '@/components/ui/Reveal';

export const metadata: Metadata = {
  title: 'Design system',
  description: 'The tokens, type scale, components and motion rules behind the LUMEN MUN site.',
};

const COLOURS = [
  ['--ink-900', '#0C0C0E', 'Page ground'],
  ['--ink-850', '#111114', 'Surface'],
  ['--ink-800', '#17171B', 'Raised surface'],
  ['--accent', '#E8A33D', 'The single accent'],
  ['--text', '#F5F3F0', 'Primary text'],
  ['--text-2', 'rgba(245,243,240,.66)', 'Secondary text'],
  ['--text-3', 'rgba(245,243,240,.44)', 'Tertiary text'],
  ['--line', 'rgba(245,243,240,.09)', 'Hairline'],
] as const;

const TYPE = [
  ['Display', 'display', 'Take the floor'],
  ['H1', 'h1', 'Page heading'],
  ['H2', 'h2', 'Section heading'],
  ['H3', 'h3', 'Card title'],
  ['Lede', 'lede', 'The opening paragraph of a page, capped at 58 characters of measure.'],
  ['Body', 'body', 'Body copy sits at 16px with 1.6 line height and never exceeds 65 characters.'],
  ['Label', 'label', 'Small caps label'],
] as const;

const RULES = [
  {
    title: 'One accent',
    body: 'Amber, used for emphasis, primary actions and state. Red survives only inside the crest artwork, which is what makes it read as deliberate rather than decorative.',
  },
  {
    title: 'One radius rule',
    body: 'Anything you can click is a pill. Surfaces are 16px. Inputs are 12px. No element invents its own corner.',
  },
  {
    title: 'One theme',
    body: 'The page is dark from the header to the footer. No section inverts mid-scroll, so the reader never feels they changed website.',
  },
  {
    title: 'Motion must mean something',
    body: 'Every animation establishes hierarchy, sequence or feedback. Content arrives once in reading order and then stays put. Nothing loops.',
  },
  {
    title: 'Photography is art-directed',
    body: 'Images render monochrome and warm to full colour on hover. That gives the hover something to say, and makes a set of unrelated photographs read as one set.',
  },
  {
    title: 'Every state is designed',
    body: 'Loading uses skeletons shaped like the real content. Empty states explain what will fill them. Errors say what to do next.',
  },
] as const;

export default function SystemPage() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <p className="label label--accent">Foundation</p>
          <h1 className="h1" style={{ marginTop: '1rem' }}>
            Design system
          </h1>
          <p className="lede page-head__lede">
            An editorial dark system: near-black warm ground, one amber accent, oversized display
            type with tight tracking, and motion that only runs when it clarifies something.
          </p>
        </div>
      </section>

      {/* Principles */}
      <section className="section--sm" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal>
            <h2 className="h2" style={{ marginBottom: 'clamp(24px, 3vw, 40px)' }}>
              Rules the system holds itself to
            </h2>
          </Reveal>

          <div className="statement-support" style={{ marginTop: 0, borderTop: 0, paddingTop: 0 }}>
            {RULES.map((rule) => (
              <Reveal key={rule.title}>
                <h3 className="h4" style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
                  <CheckIcon size={14} weight="bold" style={{ color: 'var(--accent)' }} />
                  {rule.title}
                </h3>
                <p style={{ marginTop: '0.5rem' }}>{rule.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Colour */}
      <section className="section--sm" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal>
            <h2 className="h2" style={{ marginBottom: 'clamp(20px, 2.6vw, 32px)' }}>
              Colour
            </h2>
          </Reveal>

          <Reveal>
            <div className="logo-wall" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))' }}>
              {COLOURS.map(([token, value, use]) => (
                <div key={token} style={{ background: 'var(--ink-900)' }}>
                  <div style={{ height: 84, background: value }} />
                  <div style={{ padding: '0.875rem 1rem 1.125rem' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{use}</p>
                    <p className="label" style={{ marginTop: '0.375rem', letterSpacing: '0.06em' }}>
                      {token}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Type */}
      <section className="section--sm" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal>
            <div className="section-head">
              <h2 className="h2 section-head__title">Type</h2>
              <span className="micro">Geist variable, Geist Mono for figures</span>
            </div>
          </Reveal>

          <div className="type-scale">
            {TYPE.map(([name, cls, sample]) => (
              <Reveal key={name}>
                <div className="type-row">
                  <span className="type-row__spec">{name}</span>
                  <span className={cls}>{sample}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Components */}
      <section className="section--sm" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal>
            <h2 className="h2" style={{ marginBottom: 'clamp(20px, 2.6vw, 32px)' }}>
              Components
            </h2>
          </Reveal>

          <div className="stack" style={{ ['--gap' as string]: '20px' }}>
            <Reveal>
              <div className="card" style={{ padding: 'clamp(20px, 2.6vw, 30px)' }}>
                <p className="label">Buttons</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button className="btn btn--primary" type="button">Primary</button>
                  <button className="btn btn--ghost" type="button">Ghost</button>
                  <button className="btn btn--quiet" type="button">Quiet</button>
                  <button className="btn btn--primary" type="button" disabled>Disabled</button>
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div className="card" style={{ padding: 'clamp(20px, 2.6vw, 30px)' }}>
                <p className="label">Status</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', marginTop: '1.25rem' }}>
                  <span className="status" data-tone="submitted">Submitted</span>
                  <span className="status" data-tone="pending_review">Pending review</span>
                  <span className="status" data-tone="approved">Approved</span>
                  <span className="status" data-tone="rejected">Rejected</span>
                  <span className="status" data-tone="waitlisted">Waitlisted</span>
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div className="card" style={{ padding: 'clamp(20px, 2.6vw, 30px)' }}>
                <p className="label">Fields</p>
                <div className="form-row" style={{ marginTop: '1.25rem' }}>
                  <label className="field">
                    <span className="field__label">Full name</span>
                    <input className="input" placeholder="Aarav Reddy" readOnly />
                  </label>
                  <label className="field">
                    <span className="field__label">Committee</span>
                    <select className="select" defaultValue="unsc">
                      <option value="unsc">UN Security Council</option>
                    </select>
                  </label>
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div className="card" style={{ padding: 'clamp(20px, 2.6vw, 30px)' }}>
                <p className="label">Notices</p>
                <div className="stack" style={{ ['--gap' as string]: '12px', marginTop: '1.25rem' }}>
                  <div className="notice"><span>Neutral. Context the reader may want.</span></div>
                  <div className="notice" data-tone="accent"><span>Accent. Something time-sensitive.</span></div>
                  <div className="notice" data-tone="success"><span>Success. The thing worked.</span></div>
                  <div className="notice" data-tone="error"><span>Error. What went wrong and what to do.</span></div>
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div className="card" style={{ padding: 'clamp(20px, 2.6vw, 30px)' }}>
                <p className="label">Loading</p>
                <div className="stack" style={{ ['--gap' as string]: '10px', marginTop: '1.25rem', maxWidth: 420 }}>
                  <span className="skeleton skeleton--title" />
                  <span className="skeleton skeleton--line" />
                  <span className="skeleton skeleton--line" style={{ width: '72%' }} />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
