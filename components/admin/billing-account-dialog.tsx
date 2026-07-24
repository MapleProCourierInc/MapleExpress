"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CreditCard, Loader2, PencilLine, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/client-api"
import type { AdminBillingAccount } from "@/types/admin-customer-billing"

function amount(value: number | null | undefined, currency: string) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
  }).format(Number(value) || 0)
}

function dateTime(value?: string | null) {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "-"
  return parsed.toLocaleString("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function humanize(value?: string | null) {
  if (!value) return "-"
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function statusClass(status?: string | null) {
  switch (String(status || "").toUpperCase()) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "SUSPENDED":
    case "DISABLED":
      return "border-amber-200 bg-amber-50 text-amber-700"
    case "CLOSED":
      return "border-slate-200 bg-slate-100 text-slate-700"
    default:
      return "border-slate-200 bg-white text-slate-700"
  }
}

function readErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback
  const candidate = payload as {
    message?: unknown
    errors?: Array<{ message?: unknown }>
  }
  const fieldMessage = candidate.errors?.find((item) => typeof item?.message === "string")?.message
  if (typeof fieldMessage === "string" && fieldMessage.trim()) return fieldMessage
  if (typeof candidate.message === "string" && candidate.message.trim()) return candidate.message
  return fallback
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0 border-b border-slate-100 py-3 last:border-b-0">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className={`mt-1 break-words text-sm font-medium text-slate-900 ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  )
}

export function BillingAccountDialog({ billingAccountId }: { billingAccountId: string }) {
  const [open, setOpen] = useState(false)
  const [account, setAccount] = useState<AdminBillingAccount | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [creditLimit, setCreditLimit] = useState("")
  const [reason, setReason] = useState("")
  const [creditLimitError, setCreditLimitError] = useState<string | null>(null)
  const [reasonError, setReasonError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const { toast } = useToast()

  const endpoint = `/api/admin/customers/billing/accounts/${encodeURIComponent(billingAccountId)}`

  const loadAccount = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setLoading(true)
      setLoadError(null)
    }

    try {
      const response = await apiFetch(endpoint)
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        if (showLoader) {
          setLoadError(readErrorMessage(payload, "Unable to load this billing account."))
        }
        return null
      }

      const nextAccount = payload as AdminBillingAccount
      setAccount(nextAccount)
      return nextAccount
    } catch {
      if (showLoader) {
        setLoadError("Unable to reach billing management. Please try again.")
      }
      return null
    } finally {
      if (showLoader) setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    if (!open) return
    void loadAccount()
  }, [loadAccount, open])

  useEffect(() => {
    if (open) return
    setEditing(false)
    setCreditLimit("")
    setReason("")
    setCreditLimitError(null)
    setReasonError(null)
  }, [open])

  const currency = account?.currency || "CAD"
  const creditExposure = useMemo(() => {
    if (!account) return 0
    return Math.max(
      0,
      Number(account.currentUnbilledAmount || 0) +
        Number(account.totalOutstandingAmount || 0) -
        Number(account.creditBalance || 0),
    )
  }, [account])
  const availableCredit = Math.max(0, Number(account?.creditLimit || 0) - creditExposure)

  const startEditing = () => {
    setCreditLimit(String(account?.creditLimit ?? 0))
    setReason("")
    setCreditLimitError(null)
    setReasonError(null)
    setEditing(true)
  }

  const cancelEditing = () => {
    setEditing(false)
    setCreditLimitError(null)
    setReasonError(null)
  }

  const submitCreditLimit = async () => {
    if (!account) return
    const parsedLimit = creditLimit.trim() ? Number(creditLimit) : Number.NaN
    let invalid = false

    if (!Number.isFinite(parsedLimit) || parsedLimit < 0) {
      setCreditLimitError("Credit limit must be 0 or greater")
      invalid = true
    } else if (parsedLimit === Number(account.creditLimit || 0)) {
      setCreditLimitError("Enter a different credit limit")
      invalid = true
    } else {
      setCreditLimitError(null)
    }

    if (!reason.trim()) {
      setReasonError("Reason is required")
      invalid = true
    } else if (reason.trim().length > 500) {
      setReasonError("Reason cannot exceed 500 characters")
      invalid = true
    } else {
      setReasonError(null)
    }

    if (invalid) return

    try {
      setUpdating(true)
      const response = await apiFetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creditLimit: parsedLimit,
          reason: reason.trim(),
          ...(Number.isInteger(account.mongoVersion) ? { mongoVersion: account.mongoVersion } : {}),
        }),
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        const message = readErrorMessage(payload, "Unable to update the credit limit.")
        if (response.status === 409) {
          const latestAccount = await loadAccount(false)
          if (latestAccount) setEditing(false)
          toast({
            title: "Billing account changed",
            description: latestAccount
              ? "Another update was saved first. The latest account values are now displayed."
              : "Another update was saved first, but the latest account values could not be reloaded.",
            variant: "destructive",
          })
        } else {
          toast({ title: "Credit limit not updated", description: message, variant: "destructive" })
        }
        return
      }

      setAccount((current) =>
        current
          ? {
              ...current,
              ...payload,
              creditLimit: parsedLimit,
            }
          : current,
      )
      setEditing(false)
      setCreditLimit("")
      setReason("")
      toast({
        title: "Credit limit updated",
        description: `The new limit is ${amount(parsedLimit, currency)}.`,
      })
    } catch {
      toast({
        title: "Credit limit not updated",
        description: "Unable to reach billing management. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CreditCard className="mr-2 h-4 w-4" />
          Open Billing Account
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[90vh] max-w-3xl overflow-y-auto"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <DialogTitle>Billing Account</DialogTitle>
            {account?.status ? (
              <Badge variant="outline" className={statusClass(account.status)}>
                {humanize(account.status)}
              </Badge>
            ) : null}
          </div>
          <DialogDescription className="font-mono">{billingAccountId}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading billing account...
          </div>
        ) : loadError ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 border-y border-slate-200 py-8 text-center">
            <p className="max-w-md text-sm text-destructive">{loadError}</p>
            <Button variant="outline" size="sm" onClick={() => void loadAccount()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : account ? (
          <div className="space-y-5">
            <section className="border-y border-slate-200">
              <div className="grid divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <div className="p-4">
                  <p className="text-xs font-medium text-slate-500">Credit limit</p>
                  <p className="mt-1 text-xl font-semibold text-slate-950">{amount(account.creditLimit, currency)}</p>
                </div>
                <div className="p-4">
                  <p className="text-xs font-medium text-slate-500">Available credit</p>
                  <p className="mt-1 text-xl font-semibold text-emerald-700">{amount(availableCredit, currency)}</p>
                </div>
                <div className="p-4">
                  <p className="text-xs font-medium text-slate-500">Current exposure</p>
                  <p className="mt-1 text-xl font-semibold text-slate-950">{amount(creditExposure, currency)}</p>
                </div>
              </div>
            </section>

            {editing ? (
              <section className="space-y-4 border border-slate-200 bg-slate-50 p-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">Update credit limit</h3>
                  <p className="mt-1 text-xs text-slate-500">The reason is saved in the account audit trail.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="space-y-2">
                    <Label htmlFor="billing-account-credit-limit">New credit limit ({currency})</Label>
                    <Input
                      id="billing-account-credit-limit"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={creditLimit}
                      onChange={(event) => setCreditLimit(event.target.value)}
                      disabled={updating}
                    />
                    {creditLimitError ? <p className="text-xs text-destructive">{creditLimitError}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-account-credit-limit-reason">Reason</Label>
                    <Textarea
                      id="billing-account-credit-limit-reason"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      maxLength={500}
                      placeholder="Required business reason"
                      disabled={updating}
                    />
                    <div className="flex justify-between gap-3">
                      {reasonError ? <p className="text-xs text-destructive">{reasonError}</p> : <span />}
                      <p className="text-xs text-slate-500">{reason.trim().length}/500</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="outline" onClick={cancelEditing} disabled={updating}>
                    Cancel Edit
                  </Button>
                  <Button onClick={submitCreditLimit} disabled={updating}>
                    {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {updating ? "Updating..." : "Update Credit Limit"}
                  </Button>
                </div>
              </section>
            ) : (
              <div className="flex justify-end">
                <Button onClick={startEditing}>
                  <PencilLine className="mr-2 h-4 w-4" />
                  Update Credit Limit
                </Button>
              </div>
            )}

            <section>
              <h3 className="text-sm font-semibold text-slate-950">Account details</h3>
              <dl className="mt-2 grid border-y border-slate-200 sm:grid-cols-2 sm:gap-x-8">
                <Detail label="Owner ID" value={account.ownerId || "-"} mono />
                <Detail label="Owner type" value={humanize(account.ownerType)} />
                <Detail label="Billing mode" value={humanize(account.billingMode)} />
                <Detail label="Billing cycle" value={humanize(account.billingCycle)} />
                <Detail label="Billing email" value={account.email || "-"} />
                <Detail label="Currency" value={currency} />
                <Detail label="Unbilled amount" value={amount(account.currentUnbilledAmount, currency)} />
                <Detail label="Outstanding amount" value={amount(account.totalOutstandingAmount, currency)} />
                <Detail label="Credit balance" value={amount(account.creditBalance, currency)} />
                <Detail label="Mongo version" value={String(account.mongoVersion ?? "-")} mono />
                <Detail label="Last billed" value={dateTime(account.lastBilledDate)} />
                <Detail label="Next billing" value={dateTime(account.nextBillingDate)} />
                <Detail label="Created" value={dateTime(account.createdAt)} />
                <Detail label="Last updated" value={dateTime(account.lastUpdatedAt)} />
              </dl>
            </section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
