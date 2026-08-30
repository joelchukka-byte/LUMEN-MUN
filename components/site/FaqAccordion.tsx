'use client';

import { useId, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { PlusIcon } from '@phosphor-icons/react';

type Faq = { id: number; question: string; answer: string };

/**
 * One panel open at a time. The height animation is what tells you the panel
 * belongs to the question you clicked, so it is the one piece of motion here
 * that carries meaning rather than polish.
 */
export function FaqAccordion({ faqs, defaultOpen = 0 }: { faqs: Faq[]; defaultOpen?: number }) {
  const [open, setOpen] = useState<number | null>(faqs[defaultOpen]?.id ?? null);
  const uid = useId();
  const reduce = useReducedMotion();

  return (
    <div className="faq-list">
      {faqs.map((faq) => {
        const isOpen = open === faq.id;
        const panelId = `${uid}-panel-${faq.id}`;
        const buttonId = `${uid}-q-${faq.id}`;

        return (
          <div className="faq" key={faq.id}>
            <h3>
              <button
                type="button"
                id={buttonId}
                className="faq__q"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : faq.id)}
              >
                <span className="faq__text">{faq.question}</span>
                <PlusIcon className="faq__sign" size={18} weight="bold" />
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={reduce ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="faq__a">
                    {faq.answer.split(/\n{2,}/).map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
