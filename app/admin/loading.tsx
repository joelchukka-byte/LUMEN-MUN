import { TableSkeleton } from '@/components/site/Skeleton';

export default function Loading() {
  return (
    <>
      <div className="console__head">
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton--line" data-w="40" style={{ width: 120 }} />
          <div className="skeleton skeleton--title" style={{ marginTop: 14, width: 320 }} />
        </div>
      </div>
      <TableSkeleton rows={10} />
    </>
  );
}
