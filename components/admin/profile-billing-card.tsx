"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { OwnerType, PayLaterConfigurationEntity } from "@/types/admin-customer-billing"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { apiFetch } from "@/lib/client-api"

function humanize(value?: string | null) {
  if (!value) return "—"
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function field(value?: string | number | boolean | null) {
  if (value === null || value === undefined || value === "") return "—"
  return String(value)
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString()
}

function billingTone(status?: string) {
  const normalized = String(status || "").toUpperCase()
  if (normalized === "ACTIVE") return "default"
  if (normalized === "PENDING_BILLING_ACCOUNT") return "secondary"
  if (normalized === "FAILED") return "destructive"
  return "outline"
}

export function ProfileBillingCard({
  ownerType,
  ownerId,
  payLaterConfiguration,
}: {
  ownerType: OwnerType
  ownerId: string
  payLaterConfiguration: PayLaterConfigurationEntity
}) {
  const [loading, setLoading] = useState(false)
  const [pendingAction, setPendingAction] = useState<"ENABLE" | "DISABLE" | null>(null)
  const [reason, setReason] = useState("")
  const [notes, setNotes] = useState("")
  const [reasonError, setReasonError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const isActive = payLaterConfiguration.activationStatus === "ACTIVE"

  const onToggleIntent = (checked: boolean) => {
    const nextAction = checked ? "ENABLE" : "DISABLE"
    if ((isActive && nextAction === "ENABLE") || (!isActive && nextAction === "DISABLE")) return
    setPendingAction(nextAction)
    setReason("")
    setNotes("")
    setReasonError(null)
  }

  const submitAction = async () => {
    if (!pendingAction) return
    if (!reason.trim()) {
      setReasonError("Reason is required")
      return
    }

    try {
      setLoading(true)
      setReasonError(null)
      const response = await apiFetch("/api/admin/customers/billing/postpay/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerType,
          ownerId,
          action: pendingAction,
          reason: reason.trim(),
          notes: notes.trim(),
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        toast({
          title: pendingAction === "ENABLE" ? "Unable to enable postpay" : "Unable to disable postpay",
          description: payload?.message || "Please try again.",
          variant: "destructive",
        })
        return
      }

      const payload = await response.json().catch(() => ({}))
      toast({
        title: pendingAction === "ENABLE" ? "Postpay enabled" : "Postpay disabled",
        description: payload?.message || "Postpay status updated.",
      })
      setPendingAction(null)
      router.refresh()
    } catch {
      toast({
        title: pendingAction === "ENABLE" ? "Unable to enable postpay" : "Unable to disable postpay",
        description: "Unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Billing / Postpay</CardTitle>
              <CardDescription>Monthly billing is configured for this user.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="monthly-billing-toggle" className="text-xs text-muted-foreground">
                Monthly billing
              </Label>
              <Switch
                id="monthly-billing-toggle"
                checked={isActive}
                disabled={loading}
                onCheckedChange={onToggleIntent}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Payment Terms:</span> {humanize(payLaterConfiguration.paymentTerms)}</p>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Activation:</span>
            <Badge variant={billingTone(payLaterConfiguration.activationStatus)}>{humanize(payLaterConfiguration.activationStatus)}</Badge>
          </div>
          <p><span className="text-muted-foreground">Billing Account ID:</span> {field(payLaterConfiguration.billingAccountId)}</p>
          <p><span className="text-muted-foreground">Enabled By Admin User ID:</span> {field(payLaterConfiguration.enabledByAdminUserId)}</p>
          <p><span className="text-muted-foreground">Enabled At:</span> {formatDate(payLaterConfiguration.enabledAt)}</p>
          <p><span className="text-muted-foreground">Reason:</span> {field(payLaterConfiguration.reason)}</p>
          <p><span className="text-muted-foreground">Notes:</span> {field(payLaterConfiguration.notes)}</p>
          <p><span className="text-muted-foreground">Last Updated:</span> {formatDate(payLaterConfiguration.lastUpdatedAt)}</p>
        </CardContent>
      </Card>

      <Dialog open={Boolean(pendingAction)} onOpenChange={(open) => !open && setPendingAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pendingAction === "ENABLE" ? "Enable Postpay" : "Disable Postpay"}</DialogTitle>
            <DialogDescription>
              This is a sensitive billing change. Please confirm and provide a reason before continuing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
              Warning: You are changing the postpay status for this user. This action may impact billing behavior immediately.
            </div>
            <div className="space-y-2">
              <Label htmlFor="postpay-reason">Reason</Label>
              <Input
                id="postpay-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Required"
              />
              {reasonError ? <p className="text-xs text-destructive">{reasonError}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="postpay-notes">Notes (optional)</Label>
              <Textarea
                id="postpay-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional context"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" disabled={loading} onClick={() => setPendingAction(null)}>
              Cancel
            </Button>
            <Button disabled={loading} onClick={submitAction}>
              {loading ? "Submitting..." : pendingAction === "ENABLE" ? "Enable" : "Disable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
