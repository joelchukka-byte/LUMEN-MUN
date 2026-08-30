/**
 * Loading placeholders.
 *
 * These deliberately mirror the geometry of the real content: same container,
 * same grid, same card heights, same page-head rhythm. A skeleton that moves
 * the layout when data lands is worse than no skeleton at all.
 */

export function SkeletonLine({ width = '100%', height = 12 }: { width?: string | number; height?: number }) {
  return <div className="skeleton skeleton--line" style={{ width, height }} />;
}

export function PageHeadSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <section className="page-head">
      <div className="container">
        <div className="skeleton" style={{ width: 120, height: 12 }} />
        <div className="skeleton skeleton--title" style={{ width: 'min(420px, 70%)', height: 56, marginTop: 20 }} />
        <div style={{ display: 'grid', gap: 10, marginTop: 26, maxWidth: 560 }}>
          {Array.from({ length: lines }, (_, i) => (
            <SkeletonLine key={i} width={i === lines - 1 ? '62%' : '100%'} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function CardGridSkeleton({
  count = 3,
  className = 'committee-grid',
  height = 300,
}: {
  count?: number;
  className?: string;
  height?: number;
}) {
  return (
    <section className="section--sm" style={{ paddingTop: 0 }}>
      <div className="container">
        <div className={className}>
          {Array.from({ length: count }, (_, i) => (
            <div className="skeleton skeleton--card" key={i} style={{ minHeight: height }} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Matches the alternating editorial rows on /committees. */
export function RowsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <section className="section--sm" style={{ paddingTop: 0 }}>
      <div className="container">
        {Array.from({ length: count }, (_, i) => (
          <div className="committee-row" key={i}>
            <div className="skeleton" style={{ aspectRatio: '4 / 3', borderRadius: 'var(--r-card)' }} />
            <div style={{ display: 'grid', gap: 14 }}>
              <SkeletonLine width={80} />
              <div className="skeleton skeleton--title" style={{ width: '70%', height: 40 }} />
              <SkeletonLine width="100%" />
              <SkeletonLine width="86%" />
              <SkeletonLine width="52%" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Matches the portrait grid on /secretariat. */
export function PeopleSkeleton({ count = 8 }: { count?: number }) {
  return (
    <section className="section--sm" style={{ paddingTop: 0 }}>
      <div className="container">
        <div className="people">
          {Array.from({ length: count }, (_, i) => (
            <div key={i} style={{ display: 'grid', gap: 14 }}>
              <div className="skeleton" style={{ aspectRatio: '3 / 4', borderRadius: 'var(--r-card)' }} />
              <SkeletonLine width="70%" />
              <SkeletonLine width="45%" height={10} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Matches the stacked question rows on /faq. */
export function ListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <section className="section--sm" style={{ paddingTop: 0 }}>
      <div className="container">
        <div className="faq-list">
          {Array.from({ length: count }, (_, i) => (
            <div className="faq" key={i} style={{ padding: '24px 0' }}>
              <SkeletonLine width={`${72 - i * 4}%`} height={18} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="table-wrap" style={{ padding: 16 }}>
      {Array.from({ length: rows }, (_, i) => (
        <div
          className="skeleton skeleton--line"
          key={i}
          style={{ height: 22, marginBottom: 14, opacity: 1 - i * 0.06 }}
        />
      ))}
    </div>
  );
}
