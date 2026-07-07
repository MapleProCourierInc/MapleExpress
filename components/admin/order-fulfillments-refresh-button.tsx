"use client"

import { useTransition } from "react"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

type OrderFulfillmentsRefreshButtonProps = {
  loadedAt: string
}

export function OrderFulfillmentsRefreshButton({ loadedAt }: OrderFulfillmentsRefreshButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span className="text-xs text-muted-foreground">Loaded {loadedAt}</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => startTransition(() => router.refresh())}
        disabled={isPending}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
        {isPending ? "Refreshing" : "Refresh"}
      </Button>
    </div>
  )
}
