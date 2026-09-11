import { Skeleton } from "@/components/ui/skeleton"

export default function AdminOrdersLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2"><Skeleton className="h-8 w-36" /><Skeleton className="h-4 w-96 max-w-full" /></div>
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)}
      </div>
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-[520px] rounded-xl" />
    </div>
  )
}
