'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { CaretDownIcon } from '@phosphor-icons/react';

/**
 * The opening screen: one full viewport of the crest and nothing else.
 *
 * Two pieces of motion, both tied to something real. The crest settles in on
 * load, which is the page arriving. Then it lifts, shrinks and fades as you
 * scroll, which is the opening handing over to the content rather than just
 * sliding out of frame. Both are driven by motion values, so the scroll work
 * happens off the React render path.
 *
 * The section is painted in the artwork's own background colour, so the image
 * has no edge to see. That is why there is no gradient here: any blend would
 * put a seam back.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

export function Opening() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const crestOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const crestScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const crestY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0]);

  return (
    <section className="opening" ref={ref}>
      {/* Sits just below the top edge, so the header is asked for on the very
          first scroll rather than after the whole screen has passed. */}
      <span id="scroll-sentinel" aria-hidden="true" />

      <motion.div
        className="opening__crest"
        style={reduce ? undefined : { opacity: crestOpacity, scale: crestScale, y: crestY }}
        initial={reduce ? false : { opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: EASE }}
      >
        {/*
          unoptimized: the field colour is snapped to exactly --crest-field, and
          re-encoding through the image pipeline would shift it back off and put
          a visible square around the mark.
        */}
        <Image
          src="/img/crest-hi.webp"
          alt="The LUMEN MUN crest"
          width={1600}
          height={1588}
          sizes="(max-width: 720px) 70vw, 660px"
          priority
          unoptimized
        />
      </motion.div>

      <motion.p
        className="opening__cue"
        aria-hidden="true"
        style={reduce ? undefined : { opacity: cueOpacity }}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1, ease: EASE }}
      >
        <CaretDownIcon size={13} weight="bold" />
        Scroll
      </motion.p>
    </section>
  );
}
