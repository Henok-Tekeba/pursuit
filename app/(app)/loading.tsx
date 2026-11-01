import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="min-h-full animate-pulse pb-6">
      <div className="flex items-center justify-between border-b border-line px-4 py-[13px]">
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-2.5 w-52" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>
      <div className="space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-[10px] border border-line bg-surface-card p-4">
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className="mt-3 h-7 w-12" />
              <Skeleton className="mt-2 h-2 w-32" />
            </div>
          ))}
        </div>
        <div className="rounded-[11px] border border-line bg-surface-card p-4">
          <Skeleton className="h-8 w-52" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
