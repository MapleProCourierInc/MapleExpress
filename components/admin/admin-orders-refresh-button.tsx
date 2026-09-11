"use client"

import { useTransition } from "react"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function AdminOrdersRefreshButton({ loadedAt }: { loadedAt: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs text-muted-foreground sm:inline">Updated {loadedAt}</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => startTransition(() => router.refresh())}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
        {isPending ? "Refreshing" : "Refresh"}
      </Button>
    </div>
  )
}
