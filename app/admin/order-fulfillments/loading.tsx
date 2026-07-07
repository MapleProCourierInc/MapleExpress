import { Skeleton } from "@/components/ui/skeleton"

export default function AdminOrderFulfillmentsLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Skeleton className="h-[520px] w-full rounded-md" />
        <Skeleton className="h-[520px] w-full rounded-md" />
      </div>
    </div>
  )
}
