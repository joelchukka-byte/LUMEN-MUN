import { PageHeadSkeleton, RowsSkeleton } from '@/components/site/Skeleton';

export default function Loading() {
  return (
    <>
      <PageHeadSkeleton />
      <RowsSkeleton count={3} />
    </>
  );
}
