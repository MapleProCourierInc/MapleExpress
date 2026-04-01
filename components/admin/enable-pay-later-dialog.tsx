"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { OwnerType } from "@/types/admin-customer-billing"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiFetch } from "@/lib/client-api"

export function EnablePayLaterDialog({
  ownerType,
  ownerId,
  displayName,
}: {
  ownerType: OwnerType
  ownerId: string
  displayName: string
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [reasonError, setReasonError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const submit = async () => {
    if (!reason.trim()) {
      setReasonError("Reason is required")
      return
    }

    try {
      setLoading(true)
      setReasonError(null)
      const response = await apiFetch("/api/admin/customers/billing/pay-later/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerType,
          ownerId,
          reason: reason.trim(),
          notes: notes.trim(),
        }),
      })

      if (!response.ok) {
        const contentType = response.headers.get("content-type") || ""
        if (contentType.includes("text/plain")) {
          const message = await response.text()
          toast({ title: "Unable to enable monthly billing", description: message || "Please try again.", variant: "destructive" })
        } else {
          const payload = await response.json().catch(() => null)
          toast({
            title: payload?.message || "Unable to enable monthly billing",
            description: payload?.errors?.[0]?.message || "Please try again.",
            variant: "destructive",
          })
        }
        return
      }

      const payload = await response.json().catch(() => ({}))
      toast({ title: "Monthly billing enabled", description: payload?.message || "Billing configuration updated." })
      setOpen(false)
      setReason("")
      setNotes("")
      router.refresh()
    } catch {
      toast({ title: "Unable to enable monthly billing", description: "Unexpected error occurred.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Enable Monthly Billing</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enable Monthly Billing</DialogTitle>
          <DialogDescription>
            Enable postpay terms for <span className="font-medium">{displayName}</span> ({ownerType.toLowerCase()}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Required" />
            {reasonError ? <p className="text-xs text-destructive">{reasonError}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={loading} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={loading} onClick={submit}>
            {loading ? "Submitting..." : "Enable"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
