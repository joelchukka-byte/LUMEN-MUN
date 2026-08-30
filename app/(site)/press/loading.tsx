import { PageHeadSkeleton, CardGridSkeleton } from '@/components/site/Skeleton';

export default function Loading() {
  return (
    <>
      <PageHeadSkeleton />
      <CardGridSkeleton className="gallery" count={6} height={190} />
    </>
  );
}
