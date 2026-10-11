import { SkeletonList } from "@/components/ui/Skeleton";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <>
      <Skeleton className="h-10 w-2/3" />
      <SkeletonList />
    </>
  );
}
