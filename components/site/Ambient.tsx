'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

/**
 * The moving ground behind every page.
 *
 * Three wine washes on slow, deliberately mismatched cycles, so the pattern
 * never repeats exactly and the page never looks like a static gradient. On top
 * of that the whole field leans toward the pointer, which is what makes it feel
 * like a lit surface rather than a picture of one.
 *
 * Rendered once in the site layout, so it survives client-side navigation: the
 * node is never unmounted, the animations keep their phase, and the ground stays
 * continuous as you move between pages rather than restarting each time.
 *
 * The parallax is written straight to a CSS custom property on the element
 * rather than through React state. It updates on every pointer move, and
 * re-rendering the tree at that rate would be wasteful; this way the work is a
 * single style write and the compositor does the rest.
 *
 * The grain layer is not decoration. An eight-bit gradient across this much dark
 * area bands visibly, and a little noise dithers it away.
 */
export function Ambient() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    // Coarse pointers have no hover position to follow.
    if (!window.matchMedia('(pointer: fine)').matches) return;

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      if (frame) return; // coalesce to one write per frame
      frame = requestAnimationFrame(() => {
        frame = 0;
        const x = (event.clientX / window.innerWidth - 0.5) * 2;
        const y = (event.clientY / window.innerHeight - 0.5) * 2;
        el.style.setProperty('--px', x.toFixed(3));
        el.style.setProperty('--py', y.toFixed(3));
      });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduce]);

  return (
    <div className="ambient" aria-hidden="true" ref={ref}>
      <div className="ambient__wash ambient__wash--a" />
      <div className="ambient__wash ambient__wash--b" />
      <div className="ambient__wash ambient__wash--c" />
      <div className="ambient__grain" />
    </div>
  );
}
