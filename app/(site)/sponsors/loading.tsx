import { PageHeadSkeleton, CardGridSkeleton } from '@/components/site/Skeleton';

export default function Loading() {
  return (
    <>
      <PageHeadSkeleton />
      <CardGridSkeleton className="tiers" count={4} height={320} />
    </>
  );
}
