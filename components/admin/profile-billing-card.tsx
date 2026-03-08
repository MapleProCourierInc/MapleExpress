"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { OwnerType, PayLaterConfigurationEntity } from "@/types/admin-customer-billing"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

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
  const router = useRouter()
  const { toast } = useToast()

  const isActive = payLaterConfiguration.activationStatus === "ACTIVE"

  const onToggle = async (checked: boolean) => {
    const endpoint = checked
      ? "/api/admin/customers/billing/pay-later/resume"
      : "/api/admin/customers/billing/pay-later/disable"

    try {
      setLoading(true)
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerType, ownerId }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        toast({
          title: checked ? "Unable to resume monthly billing" : "Unable to disable monthly billing",
          description: payload?.message || "Please try again.",
          variant: "destructive",
        })
        return
      }

      const payload = await response.json().catch(() => ({}))
      toast({
        title: checked ? "Monthly billing resumed" : "Monthly billing disabled",
        description: payload?.message || "Request accepted.",
      })
      router.refresh()
    } catch {
      toast({
        title: checked ? "Unable to resume monthly billing" : "Unable to disable monthly billing",
        description: "Unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
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
            <Switch id="monthly-billing-toggle" checked={isActive} disabled={loading} onCheckedChange={onToggle} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p><span className="text-muted-foreground">Payment Terms:</span> {humanize(payLaterConfiguration.paymentTerms)}</p>
        <p className="flex items-center gap-2">
          <span className="text-muted-foreground">Activation:</span>
          <Badge variant={billingTone(payLaterConfiguration.activationStatus)}>{humanize(payLaterConfiguration.activationStatus)}</Badge>
        </p>
        <p><span className="text-muted-foreground">Billing Account ID:</span> {field(payLaterConfiguration.billingAccountId)}</p>
        <p><span className="text-muted-foreground">Enabled By Admin User ID:</span> {field(payLaterConfiguration.enabledByAdminUserId)}</p>
        <p><span className="text-muted-foreground">Enabled At:</span> {formatDate(payLaterConfiguration.enabledAt)}</p>
        <p><span className="text-muted-foreground">Reason:</span> {field(payLaterConfiguration.reason)}</p>
        <p><span className="text-muted-foreground">Notes:</span> {field(payLaterConfiguration.notes)}</p>
        <p><span className="text-muted-foreground">Last Updated:</span> {formatDate(payLaterConfiguration.lastUpdatedAt)}</p>
      </CardContent>
    </Card>
  )
}
