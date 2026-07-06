"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Ban, CheckCircle2, MoreHorizontal, PauseCircle, PlayCircle, XCircle } from "lucide-react"
import type { DriverProfileStatus } from "@/types/admin-drivers"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DriverActionDialog } from "@/components/admin/driver-action-dialog"
import { apiFetch } from "@/lib/client-api"

type ActionKey = "approve" | "reject" | "suspend" | "unsuspend" | "terminate"

const labels: Record<ActionKey, string> = {
  approve: "Approve",
  reject: "Reject",
  suspend: "Suspend",
  unsuspend: "Unsuspend",
  terminate: "Terminate",
}

const actionIcons = {
  approve: CheckCircle2,
  reject: XCircle,
  suspend: PauseCircle,
  unsuspend: PlayCircle,
  terminate: Ban,
}

export function DriverDetailActions({
  driverId,
  profileStatus,
  mode = "menu",
}: {
  driverId: string
  profileStatus?: DriverProfileStatus | string
  mode?: "menu" | "panel"
}) {
  const [currentAction, setCurrentAction] = useState<ActionKey | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const actions: ActionKey[] = ["approve", "reject", profileStatus === "SUSPENDED" ? "unsuspend" : "suspend", "terminate"]

  const submit = async (reason: string, notes: string) => {
    if (!currentAction) return

    try {
      setLoading(true)
      const response = await apiFetch(`/api/admin/drivers/${driverId}/${currentAction}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, notes }),
      })

      if (!response.ok) {
        const contentType = response.headers.get("content-type") || ""
        if (contentType.includes("text/plain")) {
          const text = await response.text()
          toast({
            title: "Action not allowed",
            description: text || "Action not allowed in current status.",
            variant: "destructive",
          })
        } else {
          const payload = await response.json().catch(() => null)
          toast({
            title: payload?.message || "Action failed",
            description: payload?.errors?.[0]?.message || "Please try again.",
            variant: "destructive",
          })
        }
        return
      }

      const data = await response.json().catch(() => ({}))
      toast({ title: labels[currentAction], description: data?.message || "Action completed successfully." })
      setCurrentAction(null)
      router.refresh()
    } catch {
      toast({ title: "Action failed", description: "Unexpected error occurred.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const isDestructiveAction = currentAction === "reject" || currentAction === "suspend" || currentAction === "terminate"

  return (
    <>
      {mode === "panel" ? (
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => {
            const Icon = actionIcons[action]
            const isDanger = action === "reject" || action === "terminate"
            return (
              <Button
                key={action}
                variant={isDanger ? "outline" : action === "approve" || action === "unsuspend" ? "default" : "secondary"}
                size="sm"
                className={isDanger ? "border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground" : undefined}
                onClick={() => setCurrentAction(action)}
              >
                <Icon className="h-4 w-4" />
                {labels[action]}
              </Button>
            )
          })}
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="mr-2 h-4 w-4" />
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {actions.map((action) => (
              <DropdownMenuItem
                key={action}
                onClick={() => setCurrentAction(action)}
                className={action === "terminate" ? "text-destructive" : undefined}
              >
                {labels[action]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <DriverActionDialog
        open={Boolean(currentAction)}
        onOpenChange={(open) => !open && setCurrentAction(null)}
        actionLabel={currentAction ? labels[currentAction] : "Action"}
        destructive={isDestructiveAction}
        loading={loading}
        onConfirm={submit}
      />
    </>
  )
}
