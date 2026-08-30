import { PageHeadSkeleton, ListSkeleton } from '@/components/site/Skeleton';

export default function Loading() {
  return (
    <>
      <PageHeadSkeleton />
      <ListSkeleton count={7} />
    </>
  );
}
