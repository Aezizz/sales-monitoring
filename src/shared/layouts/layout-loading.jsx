import { Skeleton } from "@/shared/components/ui/skeleton.jsx";

export function LayoutLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="rounded-lg border border-border bg-card p-5 shadow-sm"
            key={index}
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-5 h-8 w-32" />
            <Skeleton className="mt-4 h-3 w-full" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    </div>
  );
}
