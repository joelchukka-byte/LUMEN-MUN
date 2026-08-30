'use client';

import { motion, useReducedMotion, type Variants } from 'motion/react';
import type { ElementType, ReactNode } from 'react';

/**
 * Scroll reveal.
 *
 * The animation exists to establish reading order: content arrives in the
 * sequence you are meant to read it, once, and then stays put. It never loops
 * and never re-triggers on scroll-back.
 *
 * Under `prefers-reduced-motion` everything renders in its final state with no
 * transition at all.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

export function Reveal({
  children,
  as = 'div',
  delay = 0,
  y = 20,
  className,
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const Component = motion[as as 'div'] ?? motion.div;

  return (
    <Component
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25, margin: '0px 0px -80px 0px' }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </Component>
  );
}

/**
 * Staggered group. Wrap a list; each `RevealItem` inside arrives in turn.
 * Parent and children must live in the same client tree for the stagger to
 * orchestrate, which is why both are exported from this one module.
 */
const groupVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};

export function RevealGroup({
  children,
  className,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  const reduce = useReducedMotion();
  const Component = motion[as as 'div'] ?? motion.div;

  if (reduce) {
    const Plain = as as ElementType;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Component
      className={className}
      variants={groupVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15, margin: '0px 0px -60px 0px' }}
    >
      {children}
    </Component>
  );
}

export function RevealItem({
  children,
  className,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  const reduce = useReducedMotion();
  const Component = motion[as as 'div'] ?? motion.div;

  if (reduce) {
    const Plain = as as ElementType;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Component className={className} variants={itemVariants}>
      {children}
    </Component>
  );
}

/** Hero entrance: runs on mount rather than on scroll, since it is already in view. */
export function HeroReveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
