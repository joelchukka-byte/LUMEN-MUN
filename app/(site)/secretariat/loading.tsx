import { PageHeadSkeleton, PeopleSkeleton } from '@/components/site/Skeleton';

export default function Loading() {
  return (
    <>
      <PageHeadSkeleton />
      <PeopleSkeleton count={8} />
    </>
  );
}
