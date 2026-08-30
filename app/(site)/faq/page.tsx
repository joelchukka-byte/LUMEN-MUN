import type { Metadata } from 'next';
import Link from 'next/link';
import { getFaqs } from '@/lib/content';
import { FaqAccordion } from '@/components/site/FaqAccordion';
import { Reveal } from '@/components/ui/Reveal';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Fees, eligibility, committee allocation, accommodation and dress code for LUMEN MUN Edition I.',
};

export default async function FaqPage() {
  const faqs = await getFaqs();

  // Grouped in the order the roster defines, so related questions sit together
  // instead of forming one undifferentiated list of twenty rows.
  const order: string[] = [];
  const groups = new Map<string, typeof faqs>();
  for (const faq of faqs) {
    if (!groups.has(faq.category)) {
      groups.set(faq.category, []);
      order.push(faq.category);
    }
    groups.get(faq.category)!.push(faq);
  }

  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1 className="h1">Questions</h1>
          <p className="lede page-head__lede">
            Everything delegates and faculty coordinators ask before registering. If yours is not
            here,{' '}
            <Link className="link" href="/contact">
              write to Delegate Affairs
            </Link>{' '}
            and you will hear back within a working day.
          </p>
        </div>
      </section>

      <section className="section--sm" style={{ paddingTop: 0 }}>
        <div className="container">
          {order.map((category, groupIndex) => (
            <div key={category} style={{ marginTop: groupIndex === 0 ? 0 : 'clamp(48px, 5vw, 72px)' }}>
              <Reveal>
                <h2 className="h3" style={{ marginBottom: '1.25rem' }}>
                  {category}
                </h2>
              </Reveal>
              <Reveal>
                <FaqAccordion faqs={groups.get(category)!} defaultOpen={groupIndex === 0 ? 0 : -1} />
              </Reveal>
            </div>
          ))}

          {faqs.length === 0 && (
            <div className="empty">
              <h3 className="h4">No questions published yet</h3>
              <p className="body-sm">
                <Link className="link" href="/contact">
                  Ask us directly
                </Link>{' '}
                in the meantime.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
