"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  FilterX,
  Inbox,
  Loader2,
  MessageSquare,
  NotebookPen,
  PackageSearch,
  Paperclip,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react"

import {
  calculateGrandTotal,
  calculateItemSubtotal,
  calculateTaxRows,
  calculateTotalTax,
  roundMoney,
  toChargesMap,
} from "@/lib/admin-manual-quote-calculations"
import { apiFetch } from "@/lib/client-api"
import type { ShippingOrder } from "@/lib/order-service"
import type { PricingV2Model } from "@/types/pricing"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { ConversationChatPanel } from "@/components/shared/conversation-chat-panel"
import {
  ADMIN_MANUAL_QUOTE_PRIORITIES,
  ADMIN_MANUAL_QUOTE_REASONS,
  ADMIN_MANUAL_QUOTE_STATUSES,
  ADMIN_MANUAL_QUOTE_TICKET_STATUSES,
  type AdminCreateManualQuoteOfferRequest,
  type AdminManualQuoteApiError,
  type AdminManualQuoteCombinedDetailResponse,
  type AdminManualQuoteDetail,
  type AdminManualQuoteFilters,
  type AdminManualQuotePriority,
  type AdminManualQuoteStatus,
  type AdminManualQuoteSummary,
  type AdminManualQuoteTicketStatus,
  type ManualQuoteActionResponse,
  type ManualQuoteAttachment,
  type ManualQuoteChargeRow,
  type ManualQuoteItemLine,
  type ManualQuoteMessage,
  type ManualQuoteOffer,
  type ManualQuoteTaxRow,
  type PagedAdminManualQuoteSummaryResponse,
} from "@/types/admin-manual-quotes"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

const ALL_FILTER = "ALL"
const DEFAULT_SIZE = 20

type FilterValue<T extends string> = T | typeof ALL_FILTER
type TicketAction = "close" | "archive" | "withdraw" | "expire" | "editOffer"
type QuoteBuilderLine = {
  id: string
  orderItemId: string
  itemDisplayName: string
  customQuoteReason: string
  quoteReasonDescription: string
  charges: ManualQuoteChargeRow[]
}

type OrderItem = NonNullable<ShippingOrder["orderItems"]>[number]
type OrderStop = NonNullable<OrderItem["pickup"]>
type OrderAddress = NonNullable<OrderStop["address"]>

const statusLabels: Record<AdminManualQuoteTicketStatus, string> = {
  OPEN: "Open",
  WAITING_FOR_ADMIN: "Waiting for admin",
  WAITING_FOR_CUSTOMER: "Waiting for customer",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
}

const offerStatusLabels: Record<AdminManualQuoteStatus, string> = {
  OFFERED: "Offered",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
  WITHDRAWN: "Withdrawn",
  SUPERSEDED: "Replaced",
}

const priorityLabels: Record<AdminManualQuotePriority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
}

const statusStyles: Record<AdminManualQuoteTicketStatus | "UNKNOWN", string> = {
  OPEN: "border-slate-200 bg-slate-100 text-slate-800",
  WAITING_FOR_ADMIN: "border-red-200 bg-red-50 text-red-800",
  WAITING_FOR_CUSTOMER: "border-amber-200 bg-amber-50 text-amber-900",
  IN_PROGRESS: "border-blue-200 bg-blue-50 text-blue-800",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CLOSED: "border-slate-200 bg-slate-50 text-slate-700",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-800",
  UNKNOWN: "border-slate-200 bg-slate-50 text-slate-700",
}

const offerStatusStyles: Record<AdminManualQuoteStatus | "UNKNOWN", string> = {
  OFFERED: "border-amber-200 bg-amber-50 text-amber-900",
  ACCEPTED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  REJECTED: "border-red-200 bg-red-50 text-red-800",
  EXPIRED: "border-slate-200 bg-slate-100 text-slate-700",
  WITHDRAWN: "border-slate-200 bg-slate-100 text-slate-700",
  SUPERSEDED: "border-blue-200 bg-blue-50 text-blue-800",
  UNKNOWN: "border-slate-200 bg-slate-50 text-slate-700",
}

const priorityStyles: Record<AdminManualQuotePriority | "UNKNOWN", string> = {
  LOW: "border-slate-200 bg-slate-50 text-slate-700",
  NORMAL: "border-emerald-200 bg-emerald-50 text-emerald-800",
  HIGH: "border-amber-200 bg-amber-50 text-amber-900",
  URGENT: "border-red-200 bg-red-50 text-red-800",
  UNKNOWN: "border-slate-200 bg-slate-50 text-slate-700",
}

function isKnownStatus(status?: string | null): status is AdminManualQuoteTicketStatus {
  return ADMIN_MANUAL_QUOTE_TICKET_STATUSES.includes(status as AdminManualQuoteTicketStatus)
}

function isKnownOfferStatus(status?: string | null): status is AdminManualQuoteStatus {
  return ADMIN_MANUAL_QUOTE_STATUSES.includes(status as AdminManualQuoteStatus)
}

function isKnownPriority(priority?: string | null): priority is AdminManualQuotePriority {
  return ADMIN_MANUAL_QUOTE_PRIORITIES.includes(priority as AdminManualQuotePriority)
}

function formatStatus(status?: string | null) {
  return isKnownStatus(status) ? statusLabels[status] : "Unknown"
}

function formatOfferStatus(status?: string | null) {
  return isKnownOfferStatus(status) ? offerStatusLabels[status] : "No quote"
}

function formatPriority(priority?: string | null) {
  return isKnownPriority(priority) ? priorityLabels[priority] : "Unknown"
}

function humanize(value?: string | null) {
  if (!value) return "N/A"
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function formatDateTime(value?: string | null) {
  if (!value) return "N/A"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "N/A"

  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function formatCurrency(amount?: number | null, currency = "CAD") {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "Not provided"

  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currency || "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatBytes(size?: number | null) {
  if (typeof size !== "number" || !Number.isFinite(size)) return "Size unavailable"
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 16)
  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function fromDateTimeLocal(value: string) {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toISOString()
}

function defaultExpiryLocal() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return toDateTimeLocal(date.toISOString())
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function errorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = String((payload as { message?: unknown }).message || "").trim()
    if (message) return message
  }
  return fallback
}

async function readApi<T>(response: Response, fallback: string): Promise<T> {
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(errorMessage(payload, fallback))
  }
  return payload as T
}

function sortedOffers(offers?: ManualQuoteOffer[] | null) {
  return [...(offers || [])].sort((left, right) => {
    const leftTime = new Date(left.quotedAt || left.expiresAt || "").getTime()
    const rightTime = new Date(right.quotedAt || right.expiresAt || "").getTime()
    return (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0)
  })
}

function getCurrentOffer(ticket?: Pick<AdminManualQuoteSummary, "manualQuoteOffers"> | null) {
  const offers = sortedOffers(ticket?.manualQuoteOffers)
  return (
    offers.find((offer) => offer.status === "OFFERED") ||
    offers.find((offer) => offer.status === "ACCEPTED") ||
    offers[0] ||
    null
  )
}

function ticketShippingOrderId(ticket?: AdminManualQuoteSummary | null, order?: ShippingOrder | null) {
  return (
    ticket?.relatedResource?.shippingOrderId ||
    getCurrentOffer(ticket)?.shippingOrderId ||
    order?.shippingOrderId ||
    ticket?.shippingOrder?.shippingOrderId ||
    null
  )
}

function ticketOrderLabel(ticket?: AdminManualQuoteSummary | null, order?: ShippingOrder | null) {
  return ticket?.relatedResource?.displayLabel || ticketShippingOrderId(ticket, order) || "Shipping order unavailable"
}

function customerDisplay(ticket?: AdminManualQuoteSummary | AdminManualQuoteDetail | null) {
  const snapshot = ticket?.clientSnapshot
  return (
    snapshot?.organizationName ||
    snapshot?.fullName ||
    snapshot?.email ||
    ticket?.organizationId ||
    ticket?.clientUserId ||
    "Unknown customer"
  )
}

function responseTicket(response: AdminManualQuoteCombinedDetailResponse | ManualQuoteActionResponse) {
  return response.ticket ?? null
}

function canMutate(ticket?: AdminManualQuoteDetail | null) {
  return Boolean(ticket && !ticket.archived && !["CLOSED", "CANCELLED"].includes(ticket.status || ""))
}

function canReplyToCustomer(ticket?: AdminManualQuoteDetail | null) {
  return Boolean(ticket && !ticket.archived && !["CLOSED", "CANCELLED"].includes(ticket.status || ""))
}

function hasAcceptedManualQuote(ticket?: Pick<AdminManualQuoteDetail, "manualQuoteOffers"> | null) {
  return Boolean((ticket?.manualQuoteOffers || []).some((offer) => offer.status === "ACCEPTED"))
}

function canCreateManualQuoteOffer(ticket?: AdminManualQuoteDetail | null) {
  return canMutate(ticket) && !hasAcceptedManualQuote(ticket)
}

function shouldExpandQuoteOffer(offer?: ManualQuoteOffer | null) {
  return offer?.status === "OFFERED" || offer?.status === "ACCEPTED"
}

function canUpdateOffer(offer?: ManualQuoteOffer | null) {
  return Boolean(offer?.quoteId && offer.status === "OFFERED")
}

function chargeEntries(charges?: Record<string, number> | null) {
  return Object.entries(charges || {}).filter(([, amount]) => typeof amount === "number" && Number.isFinite(amount))
}

function chargesTotal(charges?: Record<string, number> | null) {
  return chargeEntries(charges).reduce((sum, [, amount]) => sum + amount, 0)
}

function chargeMapValue(charges: Record<string, number> | null | undefined, label: string) {
  const match = Object.entries(charges || {}).find(
    ([name, amount]) => name.trim().toLowerCase() === label.toLowerCase() && typeof amount === "number" && Number.isFinite(amount),
  )
  return match?.[1]
}

type MergedPackagePricingRow = {
  key: string
  orderItemId?: string | null
  description: string
  pricingType: "AUTO" | "MANUAL"
  charges?: Record<string, number> | null
  currency: string
  reason?: string | null
  explanation?: string | null
}

function buildMergedPackagePricingRows(
  offer?: ManualQuoteOffer | null,
  order?: ShippingOrder | null,
): MergedPackagePricingRow[] {
  const currency = offer?.currency || orderCurrency(order)
  const manualLines = offer?.itemLines || []
  const manualById = new Map<string, ManualQuoteItemLine>()
  manualLines.forEach((line) => {
    if (line.orderItemId) manualById.set(line.orderItemId, line)
  })
  const rows: MergedPackagePricingRow[] = []
  const usedManualIds = new Set<string>()

  ;(order?.orderItems || []).forEach((item, index) => {
    const id = quoteOrderItemId(item)
    const manualLine = id ? manualById.get(id) : undefined
    if (manualLine) {
      usedManualIds.add(id)
      rows.push({
        key: `manual-${id || index}`,
        orderItemId: id,
        description: orderItemDisplayName(item, index),
        pricingType: "MANUAL",
        charges: manualLine.charges,
        currency: offer?.currency || currency,
        reason: manualLine.customQuoteReason,
        explanation: manualLine.quoteReasonDescription,
      })
      return
    }

    rows.push({
      key: `auto-${id || index}`,
      orderItemId: id,
      description: orderItemDisplayName(item, index),
      pricingType: "AUTO",
      charges: item.pricing?.charges,
      currency: item.pricing?.currency || currency,
      reason: orderItemQuoteReason(item),
      explanation: item.pricing?.customQuoteRequired ? "This package was previously marked for manual pricing." : null,
    })
  })

  manualLines.forEach((line, index) => {
    const id = line.orderItemId || ""
    if (id && usedManualIds.has(id)) return
    rows.push({
      key: `manual-extra-${id || index}`,
      orderItemId: id,
      description: line.itemDisplayName || id || `Package ${rows.length + 1}`,
      pricingType: "MANUAL",
      charges: line.charges,
      currency,
      reason: line.customQuoteReason,
      explanation: line.quoteReasonDescription,
    })
  })

  return rows
}

function PackagePricingBadge({ type }: { type: MergedPackagePricingRow["pricingType"] }) {
  return type === "MANUAL" ? (
    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">
      Manual quote
    </Badge>
  ) : (
    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
      Auto priced
    </Badge>
  )
}

function addressSummary(address?: Partial<OrderAddress> | null) {
  if (!address) return "Address unavailable"
  const parts = [address.streetAddress, address.city, address.province, address.postalCode].filter(Boolean)
  return parts.length ? parts.join(", ") : address.fullName || address.company || "Address unavailable"
}

function stopSummary(stop?: OrderStop | null) {
  return addressSummary(stop?.address)
}

function orderCurrency(order?: ShippingOrder | null) {
  return order?.aggregatedPricing?.currency || "CAD"
}

function orderTotal(order?: ShippingOrder | null) {
  return order?.aggregatedPricing?.totalAmount ?? chargesTotal(order?.aggregatedPricing?.charges)
}

function orderItemDisplayName(item?: OrderItem | null, index = 0) {
  if (!item) return `Package ${index + 1}`
  return item.description || item.packageDetails?.type || item.orderItemId || item.trackingId || `Package ${index + 1}`
}

function quoteOrderItemId(item?: OrderItem | null) {
  return item?.orderItemId || item?.trackingId || ""
}

function orderItemNeedsManualQuote(item: OrderItem) {
  return Boolean(
    item.pricing?.customQuoteRequired ||
      item.pricing?.customQuoteReason ||
      item.pricing?.customQuoteReasons?.length ||
      item.pricing?.customerQuoteReasons?.length ||
      item.pricing?.customerQuoteResons?.length,
  )
}

function orderItemQuoteReason(item?: OrderItem | null) {
  const reason = (
    item?.pricing?.customQuoteReason ||
    item?.pricing?.customQuoteReasons?.[0] ||
    item?.pricing?.customerQuoteReasons?.[0] ||
    item?.pricing?.customerQuoteResons?.[0] ||
    "OTHER"
  )
  return ADMIN_MANUAL_QUOTE_REASONS.includes(reason as (typeof ADMIN_MANUAL_QUOTE_REASONS)[number]) ? reason : "OTHER"
}

function orderItemQuoteReasons(item?: OrderItem | null) {
  const reasons = [
    item?.pricing?.customQuoteReason,
    ...(item?.pricing?.customQuoteReasons || []),
    ...(item?.pricing?.customerQuoteReasons || []),
    ...(item?.pricing?.customerQuoteResons || []),
  ].filter((reason): reason is string => Boolean(reason))

  return Array.from(new Set(reasons))
}

function quotedOrderItemIds(ticket?: AdminManualQuoteDetail | null) {
  const blockedStatuses: Array<AdminManualQuoteStatus | null | undefined> = ["OFFERED", "ACCEPTED"]
  return new Set(
    (ticket?.manualQuoteOffers || [])
      .filter((offer) => blockedStatuses.includes(offer.status))
      .flatMap((offer) => offer.itemLines || [])
      .map((line) => line.orderItemId || "")
      .filter(Boolean),
  )
}

function isOrderItemEligibleForQuote(item: OrderItem, ticket?: AdminManualQuoteDetail | null) {
  const itemId = quoteOrderItemId(item)
  return Boolean(itemId && orderItemNeedsManualQuote(item) && !quotedOrderItemIds(ticket).has(itemId))
}

function firstZoneCode(order?: ShippingOrder | null) {
  const itemWithZone = order?.orderItems?.find((item) => {
    const pricing = item.pricing as ({ zoneCode?: string | null } & NonNullable<OrderItem["pricing"]>) | null | undefined
    return Boolean(pricing?.zoneCode)
  })
  const pricing = itemWithZone?.pricing as ({ zoneCode?: string | null } & NonNullable<OrderItem["pricing"]>) | null | undefined
  return pricing?.zoneCode || null
}

function StatusBadge({ status }: { status?: string | null }) {
  const key = isKnownStatus(status) ? status : "UNKNOWN"
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-bold uppercase", statusStyles[key])}>
      {formatStatus(status)}
    </Badge>
  )
}

function OfferStatusBadge({ status }: { status?: string | null }) {
  const key = isKnownOfferStatus(status) ? status : "UNKNOWN"
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-bold uppercase", offerStatusStyles[key])}>
      {formatOfferStatus(status)}
    </Badge>
  )
}

function PriorityBadge({ priority }: { priority?: string | null }) {
  const key = isKnownPriority(priority) ? priority : "UNKNOWN"
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-bold uppercase", priorityStyles[key])}>
      {formatPriority(priority)}
    </Badge>
  )
}

function SummaryCard({ label, value, helper, icon }: { label: string; value: number; helper: string; icon: ReactNode }) {
  return (
    <Card className="bg-card">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 font-mono text-xl font-bold">{value}</p>
          </div>
          <div className="rounded-full bg-primary/10 p-2 text-primary">{icon}</div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  )
}

function MetadataItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-medium">{value || "N/A"}</div>
    </div>
  )
}

function ListLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-14 rounded-md" />
      ))}
    </div>
  )
}

function DetailLoading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
    </div>
  )
}

function AttachmentCards({ attachments }: { attachments?: ManualQuoteAttachment[] | null }) {
  const files = attachments || []
  if (!files.length) return null

  return (
    <div className="mt-3 grid gap-2">
      {files.map((attachment, index) => {
        const key = attachment.attachmentId || attachment.storageKey || `${attachment.fileName}-${index}`
        const content = (
          <>
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{attachment.fileName || "Attachment"}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(attachment.sizeBytes)}</span>
          </>
        )

        if (attachment.downloadUrl) {
          return (
            <a
              key={key}
              href={attachment.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs hover:bg-muted"
            >
              {content}
            </a>
          )
        }

        return (
          <div
            key={key}
            title={attachment.storageKey || undefined}
            className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs"
          >
            {content}
          </div>
        )
      })}
    </div>
  )
}

function MessageBubble({ message }: { message: ManualQuoteMessage }) {
  const senderType = message.senderType || "SYSTEM"
  const internal = Boolean(message.internalNote)
  const customer = senderType === "CUSTOMER"
  const system = senderType === "SYSTEM"

  if (system && !internal) {
    return (
      <div className="flex justify-center">
        <div className="max-w-[90%] rounded-full border bg-muted/30 px-4 py-2 text-center text-xs text-muted-foreground">
          <span>{message.message || "System update"}</span>
          <span className="ml-2">{formatDateTime(message.createdAt)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex", customer ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[92%] rounded-[1.4rem] px-5 py-4 text-base shadow-sm md:max-w-[78%]",
          internal
            ? "border border-amber-300 bg-amber-50 text-amber-950"
            : customer
              ? "border border-slate-200 bg-white text-slate-800 shadow-[0_1px_4px_rgba(15,23,42,0.08)]"
              : "bg-[#b0163a] text-white",
        )}
      >
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="font-semibold">{message.senderDisplayName || (customer ? "Customer" : "Admin")}</span>
          {internal ? (
            <Badge variant="outline" className="border-amber-400 bg-amber-100 text-amber-950">
              Internal note - only visible to admins
            </Badge>
          ) : null}
          <span className={internal || customer ? "font-medium text-muted-foreground" : "font-medium text-white/70"}>
            {formatDateTime(message.createdAt)}
          </span>
        </div>
        <p className="whitespace-pre-wrap leading-7">{message.message || ""}</p>
        <AttachmentCards attachments={message.attachments} />
      </div>
    </div>
  )
}

function ChargeBreakdown({ charges, currency }: { charges?: Record<string, number> | null; currency?: string | null }) {
  const entries = chargeEntries(charges)
  if (!entries.length) return null

  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Package charges</p>
      <div className="mt-2 space-y-1.5">
        {entries.map(([label, amount]) => (
          <div key={label} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{humanize(label)}</span>
            <span className="font-mono font-semibold">{formatCurrency(amount, currency || "CAD")}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ManualQuoteItemLines({ lines, currency }: { lines?: ManualQuoteItemLine[] | null; currency?: string | null }) {
  if (!lines?.length) return null

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">Quoted packages</p>
      {lines.map((line, index) => (
        <div key={line.orderItemId || index} className="rounded-lg border bg-background p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-medium">{line.itemDisplayName || line.orderItemId || `Package ${index + 1}`}</p>
              <p className="mt-1 text-xs text-muted-foreground">{line.orderItemId || "Package unavailable"}</p>
              {line.customQuoteReason ? <p className="mt-1 text-xs text-muted-foreground">{humanize(line.customQuoteReason)}</p> : null}
              {line.quoteReasonDescription ? <p className="mt-2 text-sm text-muted-foreground">{line.quoteReasonDescription}</p> : null}
            </div>
            <div className="text-right">
              {typeof chargeMapValue(line.charges, "Total") === "number" ? (
                <p className="font-mono text-sm font-semibold">
                  {formatCurrency(chargeMapValue(line.charges, "Total"), currency || "CAD")}
                </p>
              ) : null}
              {typeof chargeMapValue(line.charges, "Subtotal") === "number" ? (
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(chargeMapValue(line.charges, "Subtotal"), currency || "CAD")} package subtotal
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-3">
            <ChargeBreakdown charges={line.charges} currency={currency} />
          </div>
        </div>
      ))}
    </div>
  )
}

function MergedPackagePricingBreakdown({
  rows,
  fallbackCurrency,
}: {
  rows: MergedPackagePricingRow[]
  fallbackCurrency: string
}) {
  if (!rows.length) {
    return (
      <div className="rounded-lg border bg-muted/20 p-8 text-center">
        <PackageSearch className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">No package pricing was returned with this quote.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">Package pricing breakdown</p>
      {rows.map((row, index) => (
        <div key={row.key} className="rounded-lg border bg-background p-3">
          {(() => {
            const rowTotal = chargeMapValue(row.charges, "Total")
            const rowSubtotal = chargeMapValue(row.charges, "Subtotal")
            return (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{row.description || `Package ${index + 1}`}</p>
                <PackagePricingBadge type={row.pricingType} />
              </div>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{row.orderItemId || "Package unavailable"}</p>
              {row.reason || row.explanation ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {row.explanation || humanize(row.reason)}
                </p>
              ) : null}
            </div>
            <div className="text-left sm:text-right">
              {typeof rowTotal === "number" ? (
                <p className="font-mono text-sm font-semibold">
                  {formatCurrency(rowTotal, row.currency || fallbackCurrency)}
                </p>
              ) : null}
              {typeof rowSubtotal === "number" ? (
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(rowSubtotal, row.currency || fallbackCurrency)} package subtotal
                </p>
              ) : null}
            </div>
          </div>
            )
          })()}
          <div className="mt-3">
            <ChargeBreakdown charges={row.charges} currency={row.currency || fallbackCurrency} />
          </div>
        </div>
      ))}
    </div>
  )
}

function OrderPricingPreviewCard({ offer }: { offer: ManualQuoteOffer }) {
  const preview = offer.orderPricingPreview
  const currency = preview?.currency || offer.currency || "CAD"
  const taxEntries = chargeEntries(preview?.taxes)

  if (!preview) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
        Full order pricing preview is not available for this offer.
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Full order pricing preview</p>
          <p className="mt-1 text-xs text-muted-foreground">Backend-calculated preview for the complete order.</p>
        </div>
        <p className="font-mono text-xl font-bold">{formatCurrency(preview.total, currency)}</p>
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-mono font-semibold">{formatCurrency(preview.subtotal, currency)}</span>
        </div>
        {taxEntries.map(([name, amount]) => (
          <div key={name} className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{humanize(name)}</span>
            <span className="font-mono font-semibold">{formatCurrency(amount, currency)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 border-t pt-2">
          <span className="font-semibold">Total</span>
          <span className="font-mono font-bold">{formatCurrency(preview.total, currency)}</span>
        </div>
      </div>
    </div>
  )
}

function QuoteOfferCard({
  offer,
  order,
  onEdit,
  onWithdraw,
  onExpire,
  defaultExpanded,
}: {
  offer: ManualQuoteOffer
  order?: ShippingOrder | null
  onEdit: (offer: ManualQuoteOffer) => void
  onWithdraw: (offer: ManualQuoteOffer) => void
  onExpire: (offer: ManualQuoteOffer) => void
  defaultExpanded?: boolean
}) {
  const currency = offer.orderPricingPreview?.currency || offer.currency || "CAD"
  const packageRows = buildMergedPackagePricingRows(offer, order)
  const [expanded, setExpanded] = useState(defaultExpanded ?? shouldExpandQuoteOffer(offer))

  useEffect(() => {
    setExpanded(defaultExpanded ?? shouldExpandQuoteOffer(offer))
  }, [defaultExpanded, offer.quoteId, offer.status])

  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold">{offer.title || "Manual quote offer"}</p>
            <OfferStatusBadge status={offer.status} />
          </div>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{offer.quoteId || "Quote ID unavailable"}</p>
          {offer.description ? <p className="mt-2 text-sm text-muted-foreground">{offer.description}</p> : null}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setExpanded((current) => !current)}>
          {expanded ? "Hide details" : "View details"}
        </Button>
      </div>

      {!expanded ? (
        <div className="mt-4 rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {offer.status === "REJECTED"
                ? "Previous rejected quote collapsed."
                : "Previous quote collapsed."}
            </span>
            <span className="font-mono">{offer.customerDecisionAt ? `Decision ${formatDateTime(offer.customerDecisionAt)}` : `Quoted ${formatDateTime(offer.quotedAt)}`}</span>
          </div>
          {offer.customerRejectionReason ? <p className="mt-2 text-foreground">{offer.customerRejectionReason}</p> : null}
        </div>
      ) : null}

      {expanded ? (
        <>
      <div className="mt-4">
        <OrderPricingPreviewCard offer={offer} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetadataItem label="Expires" value={formatDateTime(offer.expiresAt)} />
        <MetadataItem label="Quoted by" value={offer.quotedByAdminUserId || "N/A"} />
        <MetadataItem label="Quoted at" value={formatDateTime(offer.quotedAt)} />
        <MetadataItem label="Customer decision" value={formatDateTime(offer.customerDecisionAt)} />
      </div>

      {offer.customerRejectionReason ? (
        <Alert className="mt-4 border-red-200 bg-red-50 text-red-900">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Customer rejected this offer.</AlertTitle>
          <AlertDescription>{offer.customerRejectionReason}</AlertDescription>
        </Alert>
      ) : null}

      {offer.status === "ACCEPTED" ? (
        <Alert className="mt-4 border-emerald-200 bg-emerald-50 text-emerald-900">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Customer accepted this quote.</AlertTitle>
          <AlertDescription>The order should now continue to payment or postpaid processing.</AlertDescription>
        </Alert>
      ) : null}

      {offer.status === "REJECTED" ? (
        <Alert className="mt-4 border-amber-200 bg-amber-50 text-amber-950">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Customer rejected this offer.</AlertTitle>
          <AlertDescription>You can send a revised quote or reply to the customer.</AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr,280px]">
        <MergedPackagePricingBreakdown rows={packageRows} fallbackCurrency={currency} />
        <div className="space-y-3">
          {canUpdateOffer(offer) ? (
            <div className="grid gap-2">
              <Button type="button" variant="outline" onClick={() => onEdit(offer)}>
                Edit safe fields
              </Button>
              <Button type="button" variant="outline" onClick={() => onWithdraw(offer)}>
                Withdraw offer
              </Button>
              <Button type="button" variant="outline" onClick={() => onExpire(offer)}>
                Mark expired
              </Button>
            </div>
          ) : null}
        </div>
      </div>
        </>
      ) : null}
    </div>
  )
}

function ShippingOrderSummary({ order }: { order?: ShippingOrder | null }) {
  const items = order?.orderItems || []
  const firstItem = items[0]
  const manualItems = items.filter(orderItemNeedsManualQuote)

  if (!order) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Shipping order</CardTitle>
          <CardDescription>The manual quote detail response did not include an associated shipping order.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Shipping order summary</CardTitle>
        <CardDescription className="font-mono">{order.shippingOrderId}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetadataItem label="Order status" value={humanize(order.orderStatus)} />
          <MetadataItem label="Payment state" value={humanize(order.paymentStatus)} />
          <MetadataItem label="Packages" value={items.length || "N/A"} />
          <MetadataItem label="Existing pricing" value={formatCurrency(orderTotal(order), orderCurrency(order))} />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <MetadataItem label="Pickup" value={stopSummary(firstItem?.pickup)} />
          <MetadataItem label="Dropoff" value={stopSummary(firstItem?.dropoff)} />
        </div>

        <ChargeBreakdown charges={order.aggregatedPricing?.charges} currency={orderCurrency(order)} />

        <div className="rounded-lg border bg-background">
          <div className="border-b px-4 py-3">
            <p className="text-sm font-semibold">Packages</p>
            {manualItems.length ? (
              <p className="mt-1 text-xs text-muted-foreground">{manualItems.length} package(s) appear to need manual quote review.</p>
            ) : null}
          </div>
          <div className="divide-y">
            {items.length ? (
              items.map((item, index) => (
                <div key={item.orderItemId || item.trackingId || index} className="grid gap-2 px-4 py-3 text-sm md:grid-cols-[1fr,auto]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{orderItemDisplayName(item, index)}</p>
                      {orderItemNeedsManualQuote(item) ? (
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">
                          Needs manual quote
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.orderItemId || item.trackingId || "Package ID unavailable"} | {humanize(item.itemStatus)}
                    </p>
                    {orderItemNeedsManualQuote(item) ? (
                      <p className="mt-1 text-xs text-muted-foreground">{humanize(orderItemQuoteReason(item))}</p>
                    ) : null}
                  </div>
                  <span className="font-mono text-sm font-semibold">
                    {formatCurrency(item.pricing?.totalAmount, item.pricing?.currency || orderCurrency(order))}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-sm text-muted-foreground">No packages returned with this quote detail.</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function builderLineTaxRows(line: QuoteBuilderLine, taxRows: ManualQuoteTaxRow[]) {
  return calculateTaxRows(calculateItemSubtotal(line), taxRows)
}

function builderLineTaxAmount(line: QuoteBuilderLine, taxRows: ManualQuoteTaxRow[]) {
  return calculateTotalTax(builderLineTaxRows(line, taxRows))
}

function builderLineTotal(line: QuoteBuilderLine, taxRows: ManualQuoteTaxRow[]) {
  return calculateGrandTotal(calculateItemSubtotal(line), builderLineTaxRows(line, taxRows))
}

function pickupStop(order?: ShippingOrder | null) {
  return order?.orderItems?.find((item) => item.pickup)?.pickup || order?.orderItems?.[0]?.pickup || null
}

function pricingTaxRowsFromModel(model?: PricingV2Model | null): ManualQuoteTaxRow[] {
  return (model?.taxes || [])
    .filter((tax) => tax.enabled)
    .map((tax, index) => ({
      id: `tax-${tax.taxCode || tax.displayName || index}`,
      name: tax.displayName || tax.taxCode || `Tax ${index + 1}`,
      rate: String(tax.percentage ?? 0),
      amount: 0,
    }))
}

function formatPercent(value?: number | string | null) {
  const parsed = typeof value === "number" ? value : Number(value ?? "")
  return Number.isFinite(parsed) ? `${parsed}%` : "N/A"
}

function dimensionsSummary(item?: OrderItem | null) {
  const dimensions = item?.packageDetails?.dimensions
  if (!dimensions) return "N/A"
  return `Length ${dimensions.length ?? "?"} cm, width ${dimensions.width ?? "?"} cm, height ${dimensions.height ?? "?"} cm`
}

function CompactPackageQuoteContext({
  item,
  blockedReason,
}: {
  item?: OrderItem | null
  blockedReason?: string | null
}) {
  if (!item) {
    return <p className="text-sm text-muted-foreground">Select a package to see weight, dimensions, route distance, pickup, and dropoff.</p>
  }

  const facts = [
    {
      label: "Weight",
      value: typeof item.packageDetails?.weight === "number" ? `${roundMoney(item.packageDetails.weight)} kg` : "N/A",
    },
    { label: "Dimensions", value: dimensionsSummary(item) },
    {
      label: "Distance",
      value: typeof item.distanceToDelivery === "number" ? `${roundMoney(item.distanceToDelivery)} km` : "N/A",
    },
  ]

  return (
    <div className="space-y-3 rounded-md border bg-background px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="break-all font-mono text-xs text-muted-foreground">{quoteOrderItemId(item) || "Package ID unavailable"}</span>
        {orderItemNeedsManualQuote(item) ? (
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">
            Needs manual quote
          </Badge>
        ) : (
          <Badge variant="outline">Auto priced</Badge>
        )}
        {blockedReason ? <Badge variant="outline">{blockedReason}</Badge> : null}
        {item.isFragile ? <Badge variant="outline">Fragile</Badge> : null}
      </div>
      <div className="grid gap-3 text-sm md:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.label} className="rounded-md border bg-muted/10 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{fact.label}</p>
            <p className="mt-1 break-words font-medium leading-relaxed">{fact.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-3 text-sm lg:grid-cols-2">
        <div className="rounded-md border bg-muted/10 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pickup</p>
          <p className="mt-1 break-words leading-relaxed">{stopSummary(item.pickup)}</p>
        </div>
        <div className="rounded-md border bg-muted/10 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dropoff</p>
          <p className="mt-1 break-words leading-relaxed">{stopSummary(item.dropoff)}</p>
        </div>
      </div>
    </div>
  )
}

function PricingReferencePanel({
  model,
  loading,
  error,
  currency,
}: {
  model: PricingV2Model | null
  loading: boolean
  error: string
  currency: string
}) {
  const packageSlabs = (model?.packageSlabs || []).filter((slab) => slab.enabled).sort((left, right) => left.tierOrder - right.tierOrder)
  const distanceSlabs = (model?.distancePricing?.distanceSlabs || []).filter((slab) => slab.enabled)
  const surcharges = (model?.surcharges || []).filter((surcharge) => surcharge.enabled)
  const taxes = (model?.taxes || []).filter((tax) => tax.enabled)

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold">Applicable pricing reference</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Used for tax rules and as a guide for manual package charges.
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Pricing unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : model ? (
        <>
          <div className="rounded-lg border bg-background p-3 text-xs">
            <p className="font-semibold">{model.name || "Applicable pricing"}</p>
            <div className="mt-2 grid gap-1">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Version</span>
                <span className="font-medium">v{model.version ?? "N/A"}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{humanize(model.status)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Zone</span>
                <span className="font-medium">{model.zoneDisplayName || model.zoneCode || "GLOBAL"}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Currency</span>
                <span className="font-medium">{model.currency || currency}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Package slabs</p>
            <div className="overflow-hidden rounded-lg border bg-background">
              {packageSlabs.length ? (
                packageSlabs.map((slab) => (
                  <div key={slab.slabCode} className="border-b px-3 py-2 text-xs last:border-b-0">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-semibold">{slab.displayName || slab.slabCode}</span>
                      <span className="font-mono font-semibold">{formatCurrency(slab.basePrice, model.currency || currency)}</span>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      Weight up to {slab.maxChargeableWeightKg ?? "any"} kg - dimensions sum up to {slab.maxDimensionSumCm ?? "any"} cm
                    </p>
                  </div>
                ))
              ) : (
                <div className="px-3 py-3 text-xs text-muted-foreground">No enabled package slabs returned.</div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Distance pricing</p>
            <div className="rounded-lg border bg-background p-3 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Included distance</span>
                <span className="font-medium">{model.distancePricing?.includedDistanceKm ?? 0} km</span>
              </div>
              <div className="mt-2 space-y-2">
                {distanceSlabs.length ? (
                  distanceSlabs.map((slab) => (
                    <div key={slab.slabCode} className="flex justify-between gap-3">
                      <span className="min-w-0 truncate">{slab.displayName || slab.slabCode}</span>
                      <span className="font-mono font-semibold">
                        {formatCurrency(slab.rate, model.currency || currency)} {slab.calculationType === "PER_KM" ? "/ km" : ""}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No enabled distance slabs returned.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Surcharges</p>
            <div className="rounded-lg border bg-background p-3 text-xs">
              {surcharges.length ? (
                <div className="space-y-2">
                  {surcharges.map((surcharge) => (
                    <div key={surcharge.surchargeCode} className="flex justify-between gap-3">
                      <span className="min-w-0 truncate">{surcharge.displayName || surcharge.surchargeCode}</span>
                      <span className="font-mono font-semibold">
                        {surcharge.calculationType === "FLAT"
                          ? formatCurrency(surcharge.amount, model.currency || currency)
                          : `${formatPercent(surcharge.percentage)} ${humanize(surcharge.percentageBase)}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No enabled surcharges returned.</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Taxes used in quote</p>
            <div className="rounded-lg border bg-background p-3 text-xs">
              {taxes.length ? (
                <div className="space-y-2">
                  {taxes.map((tax) => (
                    <div key={tax.taxCode} className="flex justify-between gap-3">
                      <span className="font-medium">{tax.displayName || tax.taxCode}</span>
                      <span className="font-mono font-semibold">{formatPercent(tax.percentage)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">This pricing model returned no enabled taxes.</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed bg-background p-3 text-xs text-muted-foreground">
          Applicable pricing will load when the dialog has a customer user ID.
        </div>
      )}
    </div>
  )
}

function CreateQuoteOfferDialog({
  open,
  onOpenChange,
  ticket,
  shippingOrder,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: AdminManualQuoteDetail | null
  shippingOrder: ShippingOrder | null
  onCreated: (response: ManualQuoteActionResponse) => void
}) {
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [currency, setCurrency] = useState("CAD")
  const [expiresAt, setExpiresAt] = useState("")
  const [messageToCustomer, setMessageToCustomer] = useState("")
  const [itemLines, setItemLines] = useState<QuoteBuilderLine[]>([])
  const [taxRows, setTaxRows] = useState<ManualQuoteTaxRow[]>([])
  const [pricingModel, setPricingModel] = useState<PricingV2Model | null>(null)
  const [pricingLoading, setPricingLoading] = useState(false)
  const [pricingError, setPricingError] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const orderItems = useMemo(() => shippingOrder?.orderItems || [], [shippingOrder])
  const pricingUserId = String(ticket?.clientUserId || "").trim()
  const pricingZoneCode = firstZoneCode(shippingOrder) || "GLOBAL"
  const blockedQuotedItemIds = useMemo(() => quotedOrderItemIds(ticket), [ticket])
  const eligibleOrderItems = useMemo(
    () => orderItems.filter((item) => isOrderItemEligibleForQuote(item, ticket)),
    [orderItems, ticket],
  )
  const eligibleOrderItemIds = useMemo(
    () => new Set(eligibleOrderItems.map((item) => quoteOrderItemId(item)).filter(Boolean)),
    [eligibleOrderItems],
  )

  useEffect(() => {
    if (!open) return

    const initialItems = eligibleOrderItems.map((item, index) => ({
      id: newId("line"),
      orderItemId: quoteOrderItemId(item),
      itemDisplayName: orderItemDisplayName(item, index),
      customQuoteReason: orderItemQuoteReason(item),
      quoteReasonDescription: "",
      charges: [],
    }))

    setTitle("")
    setDescription("")
    setCurrency(orderCurrency(shippingOrder))
    setExpiresAt(defaultExpiryLocal())
    setMessageToCustomer("")
    setItemLines(initialItems)
    setTaxRows([])
    setPricingModel(null)
    setPricingError("")
    setError("")
    setSubmitting(false)
  }, [open, eligibleOrderItems, shippingOrder])

  useEffect(() => {
    if (!open) return

    let active = true
    setPricingModel(null)
    setTaxRows([])

    if (!pricingUserId) {
      setPricingLoading(false)
      setPricingError("Customer user ID is required to load applicable pricing and taxes.")
      return
    }

    const params = new URLSearchParams({
      userId: pricingUserId,
      zoneCode: pricingZoneCode,
    })

    setPricingLoading(true)
    setPricingError("")

    apiFetch(`/api/admin/pricing/applicable?${params.toString()}`, {
      headers: { Accept: "application/json" },
    })
      .then((response) => readApi<PricingV2Model>(response, "We could not load applicable pricing for this customer."))
      .then((model) => {
        if (!active) return
        setPricingModel(model)
        setCurrency((model.currency || orderCurrency(shippingOrder)).toUpperCase())
        setTaxRows(pricingTaxRowsFromModel(model))
      })
      .catch((error) => {
        if (!active) return
        setPricingError(error instanceof Error ? error.message : "We could not load applicable pricing for this customer.")
      })
      .finally(() => {
        if (active) setPricingLoading(false)
      })

    return () => {
      active = false
    }
  }, [open, pricingUserId, pricingZoneCode, shippingOrder])

  const calculated = useMemo(() => {
    const subtotal = itemLines.reduce((sum, line) => sum + calculateItemSubtotal(line), 0)
    const calculatedTaxRows = calculateTaxRows(subtotal, taxRows)
    const taxAmount = calculateTotalTax(calculatedTaxRows)
    const totalAmount = calculateGrandTotal(subtotal, calculatedTaxRows)
    return { subtotal, taxAmount, totalAmount, calculatedTaxRows }
  }, [itemLines, taxRows])

  const updateLine = (lineId: string, patch: Partial<QuoteBuilderLine>) => {
    setItemLines((current) => current.map((line) => (line.id === lineId ? { ...line, ...patch } : line)))
  }

  const updateLineCharge = (lineId: string, chargeId: string, patch: Partial<ManualQuoteChargeRow>) => {
    setItemLines((current) =>
      current.map((line) =>
        line.id === lineId
          ? { ...line, charges: line.charges.map((charge) => (charge.id === chargeId ? { ...charge, ...patch } : charge)) }
          : line,
      ),
    )
  }

  const addLine = () => {
    const selectedIds = new Set(itemLines.map((line) => line.orderItemId).filter(Boolean))
    const nextItem = eligibleOrderItems.find((item) => !selectedIds.has(quoteOrderItemId(item)))
    if (!nextItem) return

    setItemLines((current) => [
      ...current,
      {
        id: newId("line"),
        orderItemId: quoteOrderItemId(nextItem),
        itemDisplayName: orderItemDisplayName(nextItem, current.length),
        customQuoteReason: orderItemQuoteReason(nextItem),
        quoteReasonDescription: "",
        charges: [],
      },
    ])
  }

  const removeLine = (lineId: string) => {
    setItemLines((current) => (current.length > 1 ? current.filter((line) => line.id !== lineId) : current))
  }

  const addLineCharge = (lineId: string) => {
    setItemLines((current) =>
      current.map((line) =>
        line.id === lineId
          ? { ...line, charges: [...line.charges, { id: newId("charge"), name: "", amount: "" }] }
          : line,
      ),
    )
  }

  const removeLineCharge = (lineId: string, chargeId: string) => {
    setItemLines((current) =>
      current.map((line) =>
        line.id === lineId
          ? { ...line, charges: line.charges.filter((charge) => charge.id !== chargeId) }
          : line,
      ),
    )
  }

  const buildPayload = (): AdminCreateManualQuoteOfferRequest | null => {
    const errors: string[] = []
    const shippingOrderId = ticketShippingOrderId(ticket, shippingOrder)
    const seenOrderItemIds = new Set<string>()
    const taxChargeLabels = taxRows.map((row) => row.name.trim().toLowerCase()).filter(Boolean)
    const reservedChargeLabels = new Set(["subtotal", "total", ...taxChargeLabels])

    const requestLines = itemLines.map((line, index) => {
      const orderItemId = line.orderItemId.trim()
      const itemSubtotal = calculateItemSubtotal(line)
      const itemTaxRows = builderLineTaxRows(line, taxRows)
      const itemTaxAmount = calculateTotalTax(itemTaxRows)
      const itemTotal = roundMoney(itemSubtotal + itemTaxAmount)
      const baseCharges = toChargesMap(line.charges)
      const taxCharges = itemTaxRows.reduce<Record<string, number>>((charges, row) => {
        const name = row.name.trim()
        if (name) charges[name] = roundMoney((charges[name] || 0) + (row.amount || 0))
        return charges
      }, {})
      const charges = {
        ...baseCharges,
        Subtotal: itemSubtotal,
        ...taxCharges,
        Total: itemTotal,
      }

      if (!orderItemId) errors.push(`Select a package for package ${index + 1}.`)
      if (orderItemId && !eligibleOrderItemIds.has(orderItemId)) {
        errors.push(`Package ${index + 1} is not eligible for a new manual quote. Select an unquoted package that needs manual pricing.`)
      }
      if (orderItemId && seenOrderItemIds.has(orderItemId)) {
        errors.push(`Package ${index + 1} duplicates a package already selected in this quote.`)
      }
      if (orderItemId) seenOrderItemIds.add(orderItemId)
      if (!Object.keys(baseCharges).length || itemSubtotal <= 0) errors.push(`Add at least one positive charge for package ${index + 1}.`)
      if (Object.keys(baseCharges).some((name) => reservedChargeLabels.has(name.trim().toLowerCase()))) {
        errors.push(`Package ${index + 1} uses a reserved system or tax charge name. Subtotal, taxes, and Total are calculated automatically.`)
      }

      return {
        orderItemId,
        itemDisplayName: line.itemDisplayName.trim() || undefined,
        customQuoteReason: line.customQuoteReason.trim() || "OTHER",
        quoteReasonDescription: line.quoteReasonDescription.trim() || undefined,
        charges,
        subtotal: itemSubtotal,
        taxAmount: itemTaxAmount,
        totalAmount: itemTotal,
        calculationContext: {
          taxes: itemTaxRows
            .filter((row) => row.name.trim())
            .map((row) => ({ name: row.name.trim(), rate: Number(row.rate || 0), amount: row.amount || 0 })),
        },
        metadata: {
          createdFromAdminQuotesUi: true,
        },
      }
    })

    taxRows.forEach((row, index) => {
      const rate = Number(row.rate || 0)
      if (!row.name.trim()) errors.push(`Applicable pricing tax row ${index + 1} is missing a display name.`)
      if (["subtotal", "total"].includes(row.name.trim().toLowerCase())) {
        errors.push(`Applicable pricing tax row ${index + 1} uses a reserved name. Subtotal and Total are calculated automatically.`)
      }
      if (rate < 0) errors.push(`Tax row ${index + 1} cannot have a negative rate.`)
    })
    if (pricingLoading) errors.push("Applicable pricing is still loading. Wait for pricing and tax rules before sending the quote.")
    if (!pricingModel) errors.push("Applicable pricing must load before sending this quote so tax rules match the customer's pricing model.")
    if (!eligibleOrderItems.length) errors.push("No eligible manual quote packages are available for this request.")
    if (!requestLines.length) errors.push("Add at least one package quote line.")
    if (calculated.totalAmount <= 0) errors.push("Grand total must be greater than zero.")

    if (errors.length) {
      setError(errors[0])
      return null
    }

    return {
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      shippingOrderId,
      itemLines: requestLines,
      currency: currency.trim() || "CAD",
      pricingModelId: pricingModel?.id || null,
      pricingModelVersion: pricingModel?.version ?? null,
      pricingTypeApplied: "MANUAL_ADMIN_QUOTE",
      ownerIdApplied: ticket?.organizationId || ticket?.clientUserId || null,
      zoneCode: pricingModel?.zoneCode || pricingZoneCode,
      calculationContext: {
        taxes: itemLines.flatMap((line) =>
          builderLineTaxRows(line, taxRows)
            .filter((row) => row.name.trim())
            .map((row) => ({
              orderItemId: line.orderItemId,
              name: row.name.trim(),
              rate: Number(row.rate || 0),
              amount: row.amount || 0,
            })),
        ),
        taxConfiguration: taxRows
          .filter((row) => row.name.trim())
          .map((row) => ({ name: row.name.trim(), rate: Number(row.rate || 0) })),
        taxConfigurationSource: "PRICING_PAYMENT_APPLICABLE",
        pricingModelId: pricingModel?.id || null,
        pricingModelVersion: pricingModel?.version ?? null,
        pricingModelName: pricingModel?.name || null,
        pickupAddress: stopSummary(pickupStop(shippingOrder)),
        previewSubtotal: calculated.subtotal,
        previewTaxAmount: calculated.taxAmount,
        previewTotalAmount: calculated.totalAmount,
      },
      metadata: {
        createdFromAdminQuotesUi: true,
        manualQuoteTicketId: ticket?.ticketId,
      },
      expiresAt: expiresAt ? fromDateTimeLocal(expiresAt) : null,
      messageToCustomer: messageToCustomer.trim() || null,
    }
  }

  const submit = async () => {
    if (!ticket?.ticketId) return
    const payload = buildPayload()
    if (!payload) return

    setSubmitting(true)
    setError("")
    try {
      const response = await apiFetch(`/api/admin/manual-quotes/${encodeURIComponent(ticket.ticketId)}/quote-offers`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      const data = await readApi<ManualQuoteActionResponse>(
        response,
        "We could not send this quote. Please check the amounts and try again.",
      )
      toast({ title: "Manual quote sent to customer." })
      onCreated(data)
      onOpenChange(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : "We could not send this quote. Please check the amounts and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] max-h-[92vh] w-[min(96vw,1500px)] flex-col overflow-hidden p-0 sm:max-w-[1500px]">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>Create Manual Quote Offer</DialogTitle>
          <DialogDescription>
            Add manual package charges. Taxes are loaded from the customer's applicable pricing model.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="min-h-0 overflow-y-auto px-5 py-4 lg:px-6">
            <div className="space-y-4">
              {error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Failed quote creation</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <section className="rounded-lg border bg-background px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold">Basic quote info</h3>
                  </div>
                  {pricingModel ? (
                    <Badge variant="outline" className="font-mono">
                      {pricingModel.currency || currency}
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_120px_190px]">
                  <div className="space-y-1.5">
                    <Label>Title</Label>
                    <Input value={title} onChange={(event) => setTitle(event.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Currency</Label>
                    <Input value={currency} readOnly placeholder="CAD" className="bg-muted/30" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Expires at</Label>
                    <Input type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
                  </div>
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      className="min-h-[68px] resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Optional message to customer</Label>
                    <Textarea
                      value={messageToCustomer}
                      onChange={(event) => setMessageToCustomer(event.target.value)}
                      className="min-h-[68px] resize-none"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-lg border bg-background px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">Pickup and applicable taxes</h3>
                    <p className="text-xs text-muted-foreground">
                      Taxes are read-only and come from pricing-payment applicable pricing for this customer.
                    </p>
                  </div>
                  {pricingLoading ? (
                    <Badge variant="outline" className="gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading pricing
                    </Badge>
                  ) : pricingModel ? (
                    <Badge variant="outline">{pricingModel.name || "Pricing loaded"}</Badge>
                  ) : null}
                </div>

                <div className="mt-3 grid gap-3 text-sm md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_160px]">
                  <div className="rounded-md border bg-muted/10 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pickup address</p>
                    <p className="mt-1 break-words leading-relaxed">{stopSummary(pickupStop(shippingOrder))}</p>
                  </div>
                  <div className="rounded-md border bg-muted/10 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pricing source</p>
                    <p className="mt-1 break-words leading-relaxed">{pricingModel ? `${pricingModel.zoneCode || "GLOBAL"} - v${pricingModel.version}` : "Not loaded"}</p>
                  </div>
                  <div className="rounded-md border bg-muted/10 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Package subtotal</p>
                    <p className="mt-1 font-mono font-semibold">{formatCurrency(calculated.subtotal, currency)}</p>
                  </div>
                </div>

                {pricingError ? (
                  <Alert variant="destructive" className="mt-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Applicable pricing required</AlertTitle>
                    <AlertDescription>{pricingError}</AlertDescription>
                  </Alert>
                ) : null}

                <div className="mt-3 space-y-2">
                  <div className="grid gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid-cols-[1fr,120px,150px]">
                    <span>Tax from pricing</span>
                    <span>Rate</span>
                    <span>Quote tax total</span>
                  </div>
                  {pricingLoading ? (
                    <div className="grid gap-2 sm:grid-cols-[1fr,120px,150px]">
                      <Skeleton className="h-9" />
                      <Skeleton className="h-9" />
                      <Skeleton className="h-9" />
                    </div>
                  ) : taxRows.length ? (
                    calculated.calculatedTaxRows.map((tax) => (
                      <div key={tax.id} className="grid gap-2 sm:grid-cols-[1fr,120px,150px]">
                        <div className="flex items-center rounded-md border bg-muted/20 px-3 text-sm font-medium">
                          {tax.name}
                        </div>
                        <div className="flex items-center rounded-md border bg-muted/20 px-3 text-sm">
                          {formatPercent(tax.rate)}
                        </div>
                        <div className="flex items-center rounded-md border bg-muted/20 px-3 font-mono text-sm font-semibold">
                          {formatCurrency(tax.amount, currency)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-md border border-dashed bg-muted/10 p-3 text-sm text-muted-foreground">
                      The applicable pricing model returned no enabled taxes. Package tax will be zero.
                    </div>
                  )}
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <MetadataItem label="Subtotal" value={formatCurrency(calculated.subtotal, currency)} />
                  <MetadataItem label="Taxes" value={formatCurrency(calculated.taxAmount, currency)} />
                  <MetadataItem label="Manual package total" value={formatCurrency(calculated.totalAmount, currency)} />
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex flex-col gap-3 rounded-lg border bg-background px-4 py-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Packages</h3>
                    <p className="text-xs text-muted-foreground">Select unquoted packages that still need manual pricing.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addLine}
                    disabled={!eligibleOrderItems.length || itemLines.length >= eligibleOrderItems.length}
                  >
                    <Plus className="h-4 w-4" />
                    Add package quote line
                  </Button>
                </div>

                {!eligibleOrderItems.length ? (
                  <Alert className="border-amber-200 bg-amber-50 text-amber-950">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No eligible manual quote packages</AlertTitle>
                    <AlertDescription>
                      Packages are selectable only when they need manual pricing and are not already covered by an offered or accepted quote.
                    </AlertDescription>
                  </Alert>
                ) : null}

                {itemLines.map((line, index) => {
                  const selectedIdsInOtherLines = new Set(
                    itemLines
                      .filter((candidate) => candidate.id !== line.id)
                      .map((candidate) => candidate.orderItemId)
                      .filter(Boolean),
                  )
                  const selectableItems = eligibleOrderItems.filter((item) => {
                    const itemId = quoteOrderItemId(item)
                    return itemId === line.orderItemId || !selectedIdsInOtherLines.has(itemId)
                  })
                  const selectedItem = orderItems.find((item) => quoteOrderItemId(item) === line.orderItemId)
                  const blockedReason = line.orderItemId && blockedQuotedItemIds.has(line.orderItemId)
                    ? "Already has active quote"
                    : selectedItem && !orderItemNeedsManualQuote(selectedItem)
                      ? "Does not need manual quote"
                      : null
                  const packageTaxRows = builderLineTaxRows(line, taxRows)

                  return (
                    <div key={line.id} className="rounded-lg border bg-background p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold">Package {index + 1}</p>
                          <p className="text-xs text-muted-foreground">
                            Subtotal {formatCurrency(calculateItemSubtotal(line), currency)} - Total {formatCurrency(builderLineTotal(line, taxRows), currency)}
                          </p>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => removeLine(line.id)} disabled={itemLines.length === 1}>
                          Remove
                        </Button>
                      </div>

                      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(240px,0.9fr)_minmax(320px,1.1fr)]">
                        <div className="space-y-2">
                            <Label>Package</Label>
                            <Select
                              value={line.orderItemId}
                              onValueChange={(value) => {
                                const item = eligibleOrderItems.find((candidate) => quoteOrderItemId(candidate) === value)
                                updateLine(line.id, {
                                  orderItemId: value,
                                  itemDisplayName: orderItemDisplayName(item, index),
                                  customQuoteReason: orderItemQuoteReason(item),
                                  quoteReasonDescription: "",
                                })
                              }}
                              disabled={!selectableItems.length}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a package" />
                              </SelectTrigger>
                              <SelectContent>
                                {selectableItems.map((item, itemIndex) => {
                                  const value = quoteOrderItemId(item)
                                  return (
                                    <SelectItem key={value} value={value}>
                                      {orderItemDisplayName(item, itemIndex)} - {value}
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                        </div>
                          <div className="space-y-2">
                            <Label>Package Description</Label>
                            <div className="min-h-10 rounded-md border bg-muted/30 px-3 py-2 text-sm leading-relaxed">
                              <p className="break-words">{line.itemDisplayName || "Package description unavailable"}</p>
                            </div>
                          </div>
                      </div>
                      <div className="mt-3">
                        <CompactPackageQuoteContext item={selectedItem} blockedReason={blockedReason} />
                      </div>

                      <div className="mt-3 space-y-3">
                        <div className="rounded-lg border-2 border-primary/20 bg-background p-4 shadow-sm">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <Label className="text-base">Package charges</Label>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Add the manual charge rows for this package. Subtotal, taxes, and total are calculated automatically.
                              </p>
                            </div>
                            <Button type="button" variant="default" size="sm" onClick={() => addLineCharge(line.id)}>
                              <Plus className="h-4 w-4" />
                              Add charge
                            </Button>
                          </div>
                          <div className="mt-4 space-y-3">
                            {line.charges.length ? (
                              line.charges.map((charge) => (
                                <div key={charge.id} className="grid gap-3 rounded-md border bg-muted/10 p-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
                                  <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Charge name</Label>
                                    <Input
                                      value={charge.name}
                                      onChange={(event) => updateLineCharge(line.id, charge.id, { name: event.target.value })}
                                      placeholder="Charge name"
                                      className="h-11"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Amount</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={charge.amount}
                                      onChange={(event) => updateLineCharge(line.id, charge.id, { amount: event.target.value })}
                                      placeholder="Amount"
                                      className="h-11"
                                    />
                                  </div>
                                  <div className="flex items-end">
                                    <Button type="button" variant="outline" className="h-11 w-full sm:w-auto" onClick={() => removeLineCharge(line.id, charge.id)}>
                                      Remove
                                    </Button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <button
                                type="button"
                                onClick={() => addLineCharge(line.id)}
                                className="flex min-h-24 w-full items-center justify-center rounded-md border border-dashed bg-muted/10 px-4 py-5 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:bg-muted/20 hover:text-foreground"
                              >
                                Click Add charge to start pricing this package.
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="rounded-md border bg-muted/5 p-3">
                          <div className="grid gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid-cols-[1fr,120px,150px]">
                            <span>Applied package tax</span>
                            <span>Rate</span>
                            <span>Amount</span>
                          </div>
                          <div className="mt-2 space-y-2">
                            {packageTaxRows.length ? (
                              packageTaxRows.map((tax) => (
                                <div key={tax.id} className="grid gap-2 sm:grid-cols-[1fr,120px,150px]">
                                  <div className="flex items-center rounded-md border bg-muted/20 px-3 py-2 text-sm">{tax.name}</div>
                                  <div className="flex items-center rounded-md border bg-muted/20 px-3 py-2 text-sm">{formatPercent(tax.rate)}</div>
                                  <div className="flex items-center rounded-md border bg-muted/20 px-3 py-2 font-mono text-sm">
                                    {formatCurrency(tax.amount, currency)}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="rounded-md border border-dashed bg-background p-2 text-sm text-muted-foreground">
                                No enabled taxes were returned for this pricing model.
                              </p>
                            )}
                          </div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            <MetadataItem label="Subtotal" value={formatCurrency(calculateItemSubtotal(line), currency)} />
                            <MetadataItem label="Tax" value={formatCurrency(builderLineTaxAmount(line, taxRows), currency)} />
                            <MetadataItem label="Total" value={formatCurrency(builderLineTotal(line, taxRows), currency)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </section>
            </div>
          </div>

          <aside className="min-h-0 overflow-y-auto border-t bg-muted/10 px-5 py-4 lg:border-l lg:border-t-0">
            <PricingReferencePanel model={pricingModel} loading={pricingLoading} error={pricingError} currency={currency} />
          </aside>
        </div>

        <DialogFooter className="shrink-0 border-t bg-background px-6 py-4">
          <Button type="button" variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={submitting || pricingLoading || !eligibleOrderItems.length} onClick={submit}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Quote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AdminManualQuotes({
  initialData,
  initialError,
  initialFilters,
}: {
  initialData: PagedAdminManualQuoteSummaryResponse
  initialError: AdminManualQuoteApiError | null
  initialFilters: AdminManualQuoteFilters
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [data, setData] = useState(initialData)
  const [listError, setListError] = useState(initialError?.message || "")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [status, setStatus] = useState<FilterValue<AdminManualQuoteTicketStatus>>(
    initialFilters.status ? (initialFilters.status as AdminManualQuoteTicketStatus) : ALL_FILTER,
  )
  const [quoteStatus, setQuoteStatus] = useState<FilterValue<AdminManualQuoteStatus>>(
    initialFilters.quoteStatus ? (initialFilters.quoteStatus as AdminManualQuoteStatus) : ALL_FILTER,
  )
  const [priority, setPriority] = useState<FilterValue<AdminManualQuotePriority>>(
    initialFilters.priority ? (initialFilters.priority as AdminManualQuotePriority) : ALL_FILTER,
  )
  const [assignedAdminUserId, setAssignedAdminUserId] = useState(initialFilters.assignedAdminUserId || "")
  const [clientUserId, setClientUserId] = useState(initialFilters.clientUserId || "")
  const [organizationId, setOrganizationId] = useState(initialFilters.organizationId || "")
  const [shippingOrderId, setShippingOrderId] = useState(initialFilters.shippingOrderId || "")
  const [fromDate, setFromDate] = useState(toDateTimeLocal(initialFilters.fromDate))
  const [toDate, setToDate] = useState(toDateTimeLocal(initialFilters.toDate))
  const [archived, setArchived] = useState(initialFilters.archived === "true")
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<AdminManualQuoteDetail | null>(null)
  const [detailOrder, setDetailOrder] = useState<ShippingOrder | null>(null)
  const [detailError, setDetailError] = useState("")
  const [detailLoading, setDetailLoading] = useState(false)
  const [adminNotesOpen, setAdminNotesOpen] = useState(false)

  const [replyMessage, setReplyMessage] = useState("")
  const [internalNote, setInternalNote] = useState("")
  const [replyError, setReplyError] = useState("")
  const [noteError, setNoteError] = useState("")
  const [replySubmitting, setReplySubmitting] = useState(false)
  const [noteSubmitting, setNoteSubmitting] = useState(false)

  const [metadataStatus, setMetadataStatus] = useState<AdminManualQuoteTicketStatus>("OPEN")
  const [metadataPriority, setMetadataPriority] = useState<AdminManualQuotePriority>("NORMAL")
  const [metadataAssignedAdmin, setMetadataAssignedAdmin] = useState("")
  const [metadataSubmitting, setMetadataSubmitting] = useState(false)
  const [assignSubmitting, setAssignSubmitting] = useState(false)

  const [quoteBuilderOpen, setQuoteBuilderOpen] = useState(false)
  const [ticketAction, setTicketAction] = useState<{ type: TicketAction; offer?: ManualQuoteOffer } | null>(null)
  const [actionReason, setActionReason] = useState("")
  const [offerEditTitle, setOfferEditTitle] = useState("")
  const [offerEditDescription, setOfferEditDescription] = useState("")
  const [offerEditExpiresAt, setOfferEditExpiresAt] = useState("")
  const [offerEditMessage, setOfferEditMessage] = useState("")
  const [actionSubmitting, setActionSubmitting] = useState(false)

  useEffect(() => {
    setData(initialData)
    setListError(initialError?.message || "")
  }, [initialData, initialError])

  const currentPage = data.pagination.page
  const totalPages = data.pagination.totalPages

  const summary = useMemo(() => {
    return data.tickets.reduce(
      (acc, ticket) => {
        const offer = getCurrentOffer(ticket)
        const hasAccepted = ticket.manualQuoteOffers?.some((item) => item.status === "ACCEPTED")
        const hasRejected = ticket.manualQuoteOffers?.some((item) => item.status === "REJECTED")

        if (ticket.status === "WAITING_FOR_ADMIN") acc.waitingForAdmin += 1
        if (ticket.status === "IN_PROGRESS") acc.inProgress += 1
        if (ticket.status === "WAITING_FOR_CUSTOMER") acc.waitingForCustomer += 1
        if (offer?.status === "OFFERED") acc.quoteOffered += 1
        if (hasAccepted) acc.accepted += 1
        if (hasRejected || ["RESOLVED", "CLOSED", "CANCELLED"].includes(ticket.status || "") || ticket.archived) acc.rejectedClosed += 1
        if (ticket.priority === "URGENT") acc.urgent += 1
        return acc
      },
      { waitingForAdmin: 0, inProgress: 0, waitingForCustomer: 0, quoteOffered: 0, accepted: 0, rejectedClosed: 0, urgent: 0 },
    )
  }, [data.tickets])

  const hasActiveFilters = Boolean(
    status !== ALL_FILTER ||
      quoteStatus !== ALL_FILTER ||
      priority !== ALL_FILTER ||
      assignedAdminUserId.trim() ||
      clientUserId.trim() ||
      organizationId.trim() ||
      shippingOrderId.trim() ||
      fromDate ||
      toDate ||
      archived,
  )

  const activeFilterSummary = useMemo(() => {
    const parts: string[] = []
    if (status !== ALL_FILTER) parts.push(`Status: ${formatStatus(status)}`)
    if (quoteStatus !== ALL_FILTER) parts.push(`Quote: ${formatOfferStatus(quoteStatus)}`)
    if (priority !== ALL_FILTER) parts.push(`Priority: ${formatPriority(priority)}`)
    if (assignedAdminUserId.trim()) parts.push(`Assigned: ${assignedAdminUserId.trim()}`)
    if (clientUserId.trim()) parts.push(`Client: ${clientUserId.trim()}`)
    if (organizationId.trim()) parts.push(`Org: ${organizationId.trim()}`)
    if (shippingOrderId.trim()) parts.push(`Order: ${shippingOrderId.trim()}`)
    if (fromDate) parts.push(`From: ${formatDateTime(fromDateTimeLocal(fromDate))}`)
    if (toDate) parts.push(`To: ${formatDateTime(fromDateTimeLocal(toDate))}`)
    if (archived) parts.push("Archived")
    return parts
  }, [archived, assignedAdminUserId, clientUserId, fromDate, organizationId, priority, quoteStatus, shippingOrderId, status, toDate])

  const buildQuery = (page: number) => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("size", String(initialFilters.size || DEFAULT_SIZE))
    params.set("sort", initialFilters.sort || "updatedAt,desc")

    if (status !== ALL_FILTER) params.set("status", status)
    if (quoteStatus !== ALL_FILTER) params.set("quoteStatus", quoteStatus)
    if (priority !== ALL_FILTER) params.set("priority", priority)
    if (assignedAdminUserId.trim()) params.set("assignedAdminUserId", assignedAdminUserId.trim())
    if (clientUserId.trim()) params.set("clientUserId", clientUserId.trim())
    if (organizationId.trim()) params.set("organizationId", organizationId.trim())
    if (shippingOrderId.trim()) params.set("shippingOrderId", shippingOrderId.trim())
    if (fromDate) params.set("fromDate", fromDateTimeLocal(fromDate))
    if (toDate) params.set("toDate", fromDateTimeLocal(toDate))
    if (archived) params.set("archived", "true")

    return params.toString()
  }

  const refreshList = async () => {
    setIsRefreshing(true)
    setListError("")
    try {
      const params = new URLSearchParams(searchParams.toString())
      if (!params.has("page")) params.set("page", String(currentPage))
      if (!params.has("size")) params.set("size", String(initialFilters.size || DEFAULT_SIZE))
      if (!params.has("sort")) params.set("sort", initialFilters.sort || "updatedAt,desc")
      const response = await apiFetch(`/api/admin/manual-quotes?${params.toString()}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
      const payload = await readApi<PagedAdminManualQuoteSummaryResponse>(response, "We could not load manual quote requests.")
      setData(payload)
    } catch (error) {
      setListError(error instanceof Error ? error.message : "We could not load manual quote requests.")
    } finally {
      setIsRefreshing(false)
    }
  }

  const applyFilters = () => {
    router.push(`${pathname}?${buildQuery(0)}`)
  }

  const clearFilters = () => {
    setStatus(ALL_FILTER)
    setQuoteStatus(ALL_FILTER)
    setPriority(ALL_FILTER)
    setAssignedAdminUserId("")
    setClientUserId("")
    setOrganizationId("")
    setShippingOrderId("")
    setFromDate("")
    setToDate("")
    setArchived(false)
    router.push(pathname)
  }

  const pageHref = (page: number) => `${pathname}?${buildQuery(page)}`

  const syncMetadata = (ticket: AdminManualQuoteDetail) => {
    setMetadataStatus(isKnownStatus(ticket.status) ? ticket.status : "OPEN")
    setMetadataPriority(isKnownPriority(ticket.priority) ? ticket.priority : "NORMAL")
    setMetadataAssignedAdmin(ticket.assignedAdminUserId || "")
  }

  const loadDetail = async (ticketId: string) => {
    setDetailLoading(true)
    setDetailError("")
    try {
      const response = await apiFetch(`/api/admin/manual-quotes/${encodeURIComponent(ticketId)}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
      const payload = await readApi<AdminManualQuoteCombinedDetailResponse>(response, "We could not load this quote request.")
      const ticket = responseTicket(payload)
      if (!ticket) throw new Error("We could not load this quote request.")
      setDetail(ticket)
      setDetailOrder(payload.shippingOrder ?? ticket.shippingOrder ?? null)
      syncMetadata(ticket)
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "We could not load this quote request.")
    } finally {
      setDetailLoading(false)
    }
  }

  const openTicket = (ticket: AdminManualQuoteSummary) => {
    setDetail(ticket as AdminManualQuoteDetail)
    setDetailOrder(ticket.shippingOrder ?? null)
    setReplyMessage("")
    setInternalNote("")
    setReplyError("")
    setNoteError("")
    setDetailError("")
    setAdminNotesOpen(false)
    setDetailOpen(true)
    syncMetadata(ticket as AdminManualQuoteDetail)
    loadDetail(ticket.ticketId)
  }

  const updateFromActionResponse = (response: ManualQuoteActionResponse) => {
    const ticket = response.ticket
    if (ticket) {
      setDetail(ticket)
      syncMetadata(ticket)
    }
    setDetailOrder(response.shippingOrder ?? ticket?.shippingOrder ?? detailOrder)
  }

  const sendReply = async () => {
    if (!detail?.ticketId) return
    const message = replyMessage.trim()
    if (!message) {
      setReplyError("Message is required.")
      return
    }

    setReplySubmitting(true)
    setReplyError("")
    try {
      const response = await apiFetch(`/api/admin/manual-quotes/${encodeURIComponent(detail.ticketId)}/messages`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, attachments: [] }),
      })
      const payload = await readApi<ManualQuoteActionResponse>(response, "We could not send your message.")
      updateFromActionResponse(payload)
      setReplyMessage("")
      toast({ title: "Message sent", description: "Customer-visible reply was added to the quote request." })
      refreshList()
    } catch (error) {
      setReplyError(error instanceof Error ? error.message : "We could not send your message.")
    } finally {
      setReplySubmitting(false)
    }
  }

  const addInternalNote = async () => {
    if (!detail?.ticketId) return
    const message = internalNote.trim()
    if (!message) {
      setNoteError("Internal note is required.")
      return
    }

    setNoteSubmitting(true)
    setNoteError("")
    try {
      const response = await apiFetch(`/api/admin/manual-quotes/${encodeURIComponent(detail.ticketId)}/internal-notes`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, attachments: [] }),
      })
      const payload = await readApi<ManualQuoteActionResponse>(response, "We could not add this internal note.")
      updateFromActionResponse(payload)
      setInternalNote("")
      toast({ title: "Internal note added", description: "This note is only visible to admins." })
      refreshList()
    } catch (error) {
      setNoteError(error instanceof Error ? error.message : "We could not add this internal note.")
    } finally {
      setNoteSubmitting(false)
    }
  }

  const assignTicket = async () => {
    if (!detail?.ticketId) return
    setAssignSubmitting(true)
    try {
      const response = await apiFetch(`/api/admin/manual-quotes/${encodeURIComponent(detail.ticketId)}/assign`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assignedAdminUserId: metadataAssignedAdmin.trim() || null }),
      })
      const payload = await readApi<ManualQuoteActionResponse>(response, "Failed to assign manual quote request.")
      updateFromActionResponse(payload)
      toast({ title: "Manual quote assigned." })
      refreshList()
    } catch (error) {
      toast({
        title: "Assignment failed",
        description: error instanceof Error ? error.message : "Failed to assign manual quote request.",
        variant: "destructive",
      })
    } finally {
      setAssignSubmitting(false)
    }
  }

  const saveMetadata = async () => {
    if (!detail?.ticketId) return
    setMetadataSubmitting(true)
    try {
      const response = await apiFetch(`/api/admin/manual-quotes/${encodeURIComponent(detail.ticketId)}`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: metadataStatus,
          priority: metadataPriority,
          assignedAdminUserId: metadataAssignedAdmin.trim() || null,
        }),
      })
      const payload = await readApi<ManualQuoteActionResponse>(response, "Failed to update manual quote metadata.")
      updateFromActionResponse(payload)
      toast({ title: "Manual quote metadata updated." })
      refreshList()
    } catch (error) {
      toast({
        title: "Metadata update failed",
        description: error instanceof Error ? error.message : "Failed to update manual quote metadata.",
        variant: "destructive",
      })
    } finally {
      setMetadataSubmitting(false)
    }
  }

  const submitAction = async () => {
    if (!detail?.ticketId || !ticketAction) return

    setActionSubmitting(true)
    try {
      let endpoint = ""
      let method = "PATCH"
      let body: Record<string, unknown> = {}

      if (ticketAction.type === "close") {
        endpoint = `/api/admin/manual-quotes/${encodeURIComponent(detail.ticketId)}/close`
        body = { reason: actionReason.trim() || null }
      } else if (ticketAction.type === "archive") {
        endpoint = `/api/admin/manual-quotes/${encodeURIComponent(detail.ticketId)}/archive`
        body = { reason: actionReason.trim() || null }
      } else {
        const quoteId = ticketAction.offer?.quoteId
        if (!quoteId) throw new Error("Quote offer ID is required.")
        endpoint = `/api/admin/manual-quotes/${encodeURIComponent(detail.ticketId)}/quote-offers/${encodeURIComponent(quoteId)}`
        body =
          ticketAction.type === "editOffer"
            ? {
                title: offerEditTitle.trim() || undefined,
                description: offerEditDescription.trim() || undefined,
                expiresAt: offerEditExpiresAt ? fromDateTimeLocal(offerEditExpiresAt) : null,
                messageToCustomer: offerEditMessage.trim() || null,
                metadata: { updatedFromAdminQuotesUi: true },
              }
            : {
                status: ticketAction.type === "withdraw" ? "WITHDRAWN" : "EXPIRED",
                messageToCustomer: actionReason.trim() || null,
                metadata: { updatedFromAdminQuotesUi: true },
              }
      }

      const response = await apiFetch(endpoint, {
        method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
      const payload = await readApi<ManualQuoteActionResponse>(response, "Action failed. Please try again.")
      updateFromActionResponse(payload)
      setTicketAction(null)
      setActionReason("")
      toast({
        title:
          ticketAction.type === "close"
            ? "Manual quote closed."
            : ticketAction.type === "archive"
              ? "Manual quote archived."
              : ticketAction.type === "withdraw"
                ? "Quote offer withdrawn."
                : ticketAction.type === "editOffer"
                  ? "Quote offer updated."
                  : "Quote offer marked expired.",
      })
      refreshList()
    } catch (error) {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Action failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setActionSubmitting(false)
    }
  }

  const offers = sortedOffers(detail?.manualQuoteOffers)
  const actionTitle =
    ticketAction?.type === "close"
      ? "Close manual quote request"
      : ticketAction?.type === "archive"
        ? "Archive manual quote request"
        : ticketAction?.type === "withdraw"
          ? "Withdraw quote offer"
          : ticketAction?.type === "editOffer"
            ? "Edit quote offer"
            : "Mark quote offer expired"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manual Quotes</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Review shipments that need custom pricing, communicate with customers, and send manual quote offers.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={refreshList} disabled={isRefreshing}>
          <RefreshCw className={cn("h-4 w-4", isRefreshing ? "animate-spin" : "")} />
          Refresh
        </Button>
      </div>

      <Card className="bg-card">
        <CardContent className="p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">Summary</span>
                <Badge variant="outline">Waiting admin: {summary.waitingForAdmin}</Badge>
                <Badge variant="outline">Offered: {summary.quoteOffered}</Badge>
                <Badge variant="outline">Urgent: {summary.urgent}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Counts are calculated from the currently loaded result set.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setSummaryOpen((current) => !current)}>
              {summaryOpen ? "Hide summary" : "Show summary"}
            </Button>
          </div>
          {summaryOpen ? (
            <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              <SummaryCard label="Waiting for admin" value={summary.waitingForAdmin} helper="Current result set" icon={<Clock3 className="h-5 w-5" />} />
              <SummaryCard label="In progress" value={summary.inProgress} helper="Current result set" icon={<ShieldCheck className="h-5 w-5" />} />
              <SummaryCard label="Waiting for customer" value={summary.waitingForCustomer} helper="Current result set" icon={<MessageSquare className="h-5 w-5" />} />
              <SummaryCard label="Quote offered" value={summary.quoteOffered} helper="Current result set" icon={<CircleDollarSign className="h-5 w-5" />} />
              <SummaryCard label="Accepted" value={summary.accepted} helper="Current result set" icon={<CheckCircle2 className="h-5 w-5" />} />
              <SummaryCard label="Rejected/closed" value={summary.rejectedClosed} helper="Current result set" icon={<XCircle className="h-5 w-5" />} />
              <SummaryCard label="Urgent" value={summary.urgent} helper="Current result set" icon={<AlertCircle className="h-5 w-5" />} />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader className="flex flex-col gap-3 pb-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-lg">Filters</CardTitle>
            <CardDescription>
              {activeFilterSummary.length ? activeFilterSummary.join(" | ") : "Archived tickets are hidden by default."}
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setFiltersOpen((current) => !current)}>
            {filtersOpen ? "Hide filters" : "Show filters"}
          </Button>
        </CardHeader>
        {filtersOpen ? (
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as FilterValue<AdminManualQuoteTicketStatus>)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>All statuses</SelectItem>
                  {ADMIN_MANUAL_QUOTE_TICKET_STATUSES.map((item) => <SelectItem key={item} value={item}>{formatStatus(item)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quote status</Label>
              <Select value={quoteStatus} onValueChange={(value) => setQuoteStatus(value as FilterValue<AdminManualQuoteStatus>)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>All quote statuses</SelectItem>
                  {ADMIN_MANUAL_QUOTE_STATUSES.map((item) => <SelectItem key={item} value={item}>{formatOfferStatus(item)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as FilterValue<AdminManualQuotePriority>)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>All priorities</SelectItem>
                  {ADMIN_MANUAL_QUOTE_PRIORITIES.map((item) => <SelectItem key={item} value={item}>{formatPriority(item)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assigned admin</Label>
              <Input value={assignedAdminUserId} onChange={(event) => setAssignedAdminUserId(event.target.value)} placeholder="admin-user-sub-123" />
            </div>
            <div className="space-y-2">
              <Label>Client user ID</Label>
              <Input value={clientUserId} onChange={(event) => setClientUserId(event.target.value)} placeholder="customer user ID" />
            </div>
            <div className="space-y-2">
              <Label>Organization ID</Label>
              <Input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} placeholder="organization ID" />
            </div>
            <div className="space-y-2">
              <Label>Shipping order ID</Label>
              <Input value={shippingOrderId} onChange={(event) => setShippingOrderId(event.target.value)} placeholder="ORD_123" />
            </div>
            <div className="space-y-2">
              <Label>From date</Label>
              <Input type="datetime-local" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>To date</Label>
              <Input type="datetime-local" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2">
              <div>
                <Label>Show archived</Label>
                <p className="text-xs text-muted-foreground">Default list hides archived tickets.</p>
              </div>
              <Switch checked={archived} onCheckedChange={setArchived} />
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={clearFilters} disabled={!hasActiveFilters}>
              <FilterX className="h-4 w-4" />
              Clear filters
            </Button>
            <Button type="button" onClick={applyFilters}>
              Apply filters
            </Button>
          </div>
        </CardContent>
        ) : null}
      </Card>

      {listError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>We could not load manual quote requests.</AlertTitle>
          <AlertDescription>{listError}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="bg-card">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg">Manual quote requests</CardTitle>
            <CardDescription>
              {data.pagination.totalElements
                ? `${data.pagination.totalElements} request${data.pagination.totalElements === 1 ? "" : "s"} found`
                : "No manual quote requests yet."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isRefreshing ? <ListLoading /> : null}
          {!isRefreshing && data.tickets.length === 0 ? (
            <div className="rounded-lg border bg-muted/20 p-10 text-center">
              <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
              <h2 className="mt-3 text-lg font-semibold">No manual quote requests yet.</h2>
              <p className="mt-1 text-sm text-muted-foreground">Manual quote tickets will appear here after customers request custom pricing.</p>
            </div>
          ) : null}
          {!isRefreshing && data.tickets.length > 0 ? (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket number</TableHead>
                    <TableHead>Shipping order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quote status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Latest message</TableHead>
                    <TableHead>Assigned admin</TableHead>
                    <TableHead>Updated at</TableHead>
                    <TableHead>Unread</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.tickets.map((ticket) => {
                    const currentOffer = getCurrentOffer(ticket)
                    return (
                      <TableRow key={ticket.ticketId}>
                        <TableCell className="min-w-[170px]">
                          <p className="font-mono text-xs text-muted-foreground">{ticket.ticketNumber || ticket.ticketId}</p>
                          <p className="mt-1 max-w-[220px] truncate font-medium">{ticket.subject || "Manual quote request"}</p>
                        </TableCell>
                        <TableCell className="min-w-[180px]">
                          <p className="max-w-[220px] truncate font-medium">{ticketOrderLabel(ticket)}</p>
                          <p className="font-mono text-xs text-muted-foreground">{ticketShippingOrderId(ticket) || "N/A"}</p>
                        </TableCell>
                        <TableCell className="min-w-[180px]">
                          <p className="font-medium">{customerDisplay(ticket)}</p>
                          <p className="max-w-[180px] truncate text-xs text-muted-foreground">{ticket.clientSnapshot?.email || ticket.clientUserId || "N/A"}</p>
                        </TableCell>
                        <TableCell><StatusBadge status={ticket.status} /></TableCell>
                        <TableCell><OfferStatusBadge status={currentOffer?.status} /></TableCell>
                        <TableCell><PriorityBadge priority={ticket.priority} /></TableCell>
                        <TableCell className="max-w-[260px] truncate">{ticket.latestMessagePreview || "No preview"}</TableCell>
                        <TableCell className="max-w-[180px] truncate">{ticket.assignedAdminUserId || "Unassigned"}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDateTime(ticket.updatedAt)}</TableCell>
                        <TableCell>
                          {ticket.adminUnread ? (
                            <Badge variant="outline" className="border-red-200 bg-red-50 text-red-800">Unread</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button type="button" size="sm" variant="outline" onClick={() => openTicket(ticket)}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : null}

          {totalPages > 1 ? (
            <div className="mt-4 flex flex-col items-center justify-between gap-2 sm:flex-row">
              <span className="text-sm text-muted-foreground">Page {currentPage + 1} of {totalPages}</span>
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                  <PaginationItem>
                    {currentPage > 0 ? (
                      <PaginationPrevious href={pageHref(currentPage - 1)} />
                    ) : (
                      <span className="inline-flex h-9 items-center rounded-md px-3 text-sm text-muted-foreground">Previous</span>
                    )}
                  </PaginationItem>
                  <PaginationItem>
                    {currentPage + 1 < totalPages ? (
                      <PaginationNext href={pageHref(currentPage + 1)} />
                    ) : (
                      <span className="inline-flex h-9 items-center rounded-md px-3 text-sm text-muted-foreground">Next</span>
                    )}
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="right" className="flex w-full flex-col overflow-hidden p-0 sm:max-w-5xl xl:max-w-[1500px]">
          <SheetHeader className="border-b p-6 pr-12">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <SheetTitle className="truncate text-2xl">Manual quote request</SheetTitle>
                <SheetDescription className="mt-1">
                  {detail?.ticketNumber || detail?.ticketId || "Loading quote request"}
                </SheetDescription>
              </div>
              {detail ? (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setAdminNotesOpen(true)}>
                    <NotebookPen className="h-4 w-4" />
                    Admin notes
                  </Button>
                  <StatusBadge status={detail.status} />
                  <PriorityBadge priority={detail.priority} />
                  <OfferStatusBadge status={getCurrentOffer(detail)?.status} />
                  {detail.archived ? <Badge variant="outline"><Archive className="mr-1 h-3.5 w-3.5" /> Archived</Badge> : null}
                </div>
              ) : null}
            </div>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto xl:overflow-hidden">
            {detailLoading && !detail ? <DetailLoading /> : null}
            {detailError ? (
              <div className="p-6">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>We could not load this quote request.</AlertTitle>
                  <AlertDescription>{detailError}</AlertDescription>
                </Alert>
              </div>
            ) : null}
            {detail ? (
              <div className="grid min-h-0 gap-4 p-6 xl:h-full xl:grid-cols-[minmax(0,1fr)_minmax(340px,30%)]">
                <div className="min-w-0 space-y-4 xl:h-full xl:overflow-y-auto xl:pr-2">
                  <Card className="bg-card">
                    <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <CardTitle className="text-lg">{detail.subject || "Manual quote request"}</CardTitle>
                        <CardDescription>{ticketOrderLabel(detail, detailOrder)}</CardDescription>
                      </div>
                      {canCreateManualQuoteOffer(detail) ? (
                        <Button type="button" onClick={() => setQuoteBuilderOpen(true)}>
                          <Plus className="h-4 w-4" />
                          Create Quote Offer
                        </Button>
                      ) : null}
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <MetadataItem label="Assigned admin" value={detail.assignedAdminUserId || "Unassigned"} />
                      <MetadataItem label="Quote status" value={<OfferStatusBadge status={getCurrentOffer(detail)?.status} />} />
                      <MetadataItem label="Updated" value={formatDateTime(detail.updatedAt)} />
                      <MetadataItem label="Unread" value={`${detail.customerUnread ? "Customer unread" : "Customer read"} / ${detail.adminUnread ? "Admin unread" : "Admin read"}`} />
                    </CardContent>
                  </Card>

                  <Card className="bg-card">
                    <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle className="text-lg">Quote offers</CardTitle>
                        <CardDescription>Manual quote offers with auto-priced and manual-quoted packages shown together.</CardDescription>
                      </div>
                      {canCreateManualQuoteOffer(detail) ? (
                        <Button type="button" variant="outline" onClick={() => setQuoteBuilderOpen(true)}>
                          <Plus className="h-4 w-4" />
                          Create quote
                        </Button>
                      ) : null}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!offers.length ? (
                        <div className="rounded-lg border bg-muted/20 p-8 text-center">
                          <PackageSearch className="mx-auto h-8 w-8 text-muted-foreground" />
                          <p className="mt-2 text-sm font-medium">No quote has been sent yet. Create a quote offer to continue.</p>
                        </div>
                      ) : null}
                      {offers.map((offer) => (
                        <QuoteOfferCard
                          key={offer.quoteId || `${offer.quotedAt}-${offer.status}`}
                          offer={offer}
                          order={detailOrder}
                          defaultExpanded={shouldExpandQuoteOffer(offer)}
                          onEdit={(selected) => {
                            setTicketAction({ type: "editOffer", offer: selected })
                            setOfferEditTitle(selected.title || "")
                            setOfferEditDescription(selected.description || "")
                            setOfferEditExpiresAt(toDateTimeLocal(selected.expiresAt))
                            setOfferEditMessage("")
                          }}
                          onWithdraw={(selected) => {
                            setTicketAction({ type: "withdraw", offer: selected })
                            setActionReason("The previous quote has been withdrawn. We are preparing a new one.")
                          }}
                          onExpire={(selected) => {
                            setTicketAction({ type: "expire", offer: selected })
                            setActionReason("The previous quote has expired. Please contact us if you want a revised quote.")
                          }}
                        />
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="bg-card">
                    <CardHeader>
                      <CardTitle className="text-lg">Customer details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <MetadataItem label="Name" value={detail.clientSnapshot?.fullName || "N/A"} />
                      <MetadataItem label="Email" value={detail.clientSnapshot?.email || "N/A"} />
                      <MetadataItem label="Phone" value={detail.clientSnapshot?.phoneNumber || "N/A"} />
                      <MetadataItem label="Organization" value={detail.clientSnapshot?.organizationName || "N/A"} />
                      <MetadataItem label="Client user ID" value={detail.clientUserId || "N/A"} />
                      <MetadataItem label="Organization ID" value={detail.organizationId || "N/A"} />
                    </CardContent>
                  </Card>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card className="bg-card">
                      <CardHeader>
                        <CardTitle className="text-lg">Assignment and metadata</CardTitle>
                        <CardDescription>Update the dedicated quote workflow, not normal support.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Assigned admin user ID</Label>
                          <Input value={metadataAssignedAdmin} onChange={(event) => setMetadataAssignedAdmin(event.target.value)} placeholder="admin-user-sub-123" disabled={!canMutate(detail)} />
                          <Button type="button" size="sm" variant="outline" onClick={assignTicket} disabled={!canMutate(detail) || assignSubmitting}>
                            {assignSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRound className="h-4 w-4" />}
                            Assign
                          </Button>
                        </div>
                        <Separator />
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Status</Label>
                          <Select value={metadataStatus} onValueChange={(value) => setMetadataStatus(value as AdminManualQuoteTicketStatus)} disabled={!canMutate(detail)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{ADMIN_MANUAL_QUOTE_TICKET_STATUSES.map((item) => <SelectItem key={item} value={item}>{formatStatus(item)}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Priority</Label>
                          <Select value={metadataPriority} onValueChange={(value) => setMetadataPriority(value as AdminManualQuotePriority)} disabled={!canMutate(detail)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{ADMIN_MANUAL_QUOTE_PRIORITIES.map((item) => <SelectItem key={item} value={item}>{formatPriority(item)}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <Button type="button" className="w-full" onClick={saveMetadata} disabled={!canMutate(detail) || metadataSubmitting}>
                          {metadataSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                          Save metadata
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="bg-card">
                      <CardHeader>
                        <CardTitle className="text-lg">Admin actions</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-2">
                        <Button type="button" variant="outline" onClick={() => { setTicketAction({ type: "close" }); setActionReason("") }} disabled={!canMutate(detail)}>
                          <XCircle className="h-4 w-4" />
                          Close ticket
                        </Button>
                        <Button type="button" variant="outline" className="border-amber-300 text-amber-900 hover:bg-amber-50" onClick={() => { setTicketAction({ type: "archive" }); setActionReason("") }} disabled={!detail || Boolean(detail.archived)}>
                          <Archive className="h-4 w-4" />
                          Archive ticket
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <ShippingOrderSummary order={detailOrder} />
                </div>

                <aside className="min-h-0 min-w-0 space-y-4 xl:flex xl:h-full xl:flex-col xl:space-y-4">
                  <ConversationChatPanel
                    className="xl:min-h-0 xl:flex-1"
                    title="Conversation thread"
                    description="Customer-visible conversation."
                    unread={Boolean(detail.adminUnread)}
                    messages={(detail.messages || []).filter((message) => !message.internalNote)}
                    emptyTitle="No conversation messages yet."
                    emptyDescription="Customer messages and admin replies will appear here."
                    replyValue={replyMessage}
                    replyPlaceholder="We reviewed your shipment and are preparing a custom quote."
                    replyError={replyError}
                    replyDisabled={!canReplyToCustomer(detail)}
                    replyDisabledMessage="Customer replies are disabled for this manual quote request."
                    isSendingReply={replySubmitting}
                    composerHelper="Attachments can be added once the upload flow is configured."
                    onReplyChange={(value) => {
                      setReplyMessage(value)
                      setReplyError("")
                    }}
                    onSendReply={sendReply}
                    isOwnMessage={(message) => (message.senderType || "SYSTEM") !== "CUSTOMER"}
                    senderFallback={(message, isOwn) => message.senderDisplayName || (isOwn ? "Admin" : "Customer")}
                    formatDateTime={formatDateTime}
                    renderAttachments={(message) => <AttachmentCards attachments={message.attachments} />}
                  />
                </aside>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={adminNotesOpen} onOpenChange={setAdminNotesOpen}>
        <DialogContent className="flex max-h-[86vh] max-w-2xl flex-col overflow-hidden p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Admin notes</DialogTitle>
            <DialogDescription>Internal notes only visible to admins.</DialogDescription>
          </DialogHeader>
          <ConversationChatPanel
            className="min-h-[72vh] border-0 shadow-none"
            title="Admin notes"
            description="Internal notes only visible to admins."
            messages={(detail?.messages || []).filter((message) => message.internalNote)}
            emptyTitle="No admin notes yet."
            emptyDescription="Internal notes for this manual quote request will appear here."
            replyValue={internalNote}
            replyPlaceholder="Add an internal admin note..."
            replyError={noteError}
            replyDisabled={!detail || Boolean(detail.archived)}
            replyDisabledMessage="Admin notes are disabled for archived quote requests."
            isSendingReply={noteSubmitting}
            composerHelper="Internal note. This is never sent to the customer."
            onReplyChange={(value) => {
              setInternalNote(value)
              setNoteError("")
            }}
            onSendReply={addInternalNote}
            isOwnMessage={() => true}
            senderFallback={(message) => message.senderDisplayName || "Admin"}
            formatDateTime={formatDateTime}
            renderAttachments={(message) => <AttachmentCards attachments={message.attachments} />}
          />
        </DialogContent>
      </Dialog>

      <CreateQuoteOfferDialog
        open={quoteBuilderOpen && canCreateManualQuoteOffer(detail)}
        onOpenChange={setQuoteBuilderOpen}
        ticket={detail}
        shippingOrder={detailOrder}
        onCreated={(response) => {
          updateFromActionResponse(response)
          refreshList()
        }}
      />

      <Dialog open={Boolean(ticketAction)} onOpenChange={(open) => !open && setTicketAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionTitle}</DialogTitle>
            <DialogDescription>
              {ticketAction?.type === "close"
                ? "Close this manual quote request. Add an optional reason for the audit trail."
                : ticketAction?.type === "archive"
                  ? "Archive this manual quote request. Archived tickets are hidden from the default list."
                  : ticketAction?.type === "editOffer"
                    ? "Update safe quote offer fields before customer acceptance. Accepted offers cannot be changed."
                    : "This updates the quote offer before customer acceptance. Accepted offers cannot be changed."}
            </DialogDescription>
          </DialogHeader>
          {ticketAction?.type === "editOffer" ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Title</Label>
                <Input value={offerEditTitle} onChange={(event) => setOfferEditTitle(event.target.value)} placeholder="Updated manual quote" />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea value={offerEditDescription} onChange={(event) => setOfferEditDescription(event.target.value)} placeholder="Updated price after review." />
              </div>
              <div className="space-y-1">
                <Label>Expires at</Label>
                <Input type="datetime-local" value={offerEditExpiresAt} onChange={(event) => setOfferEditExpiresAt(event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Optional customer message</Label>
                <Textarea value={offerEditMessage} onChange={(event) => setOfferEditMessage(event.target.value)} placeholder="We updated the expiry for your manual quote." />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{ticketAction?.type === "withdraw" || ticketAction?.type === "expire" ? "Optional customer message" : "Reason optional"}</Label>
              <Textarea
                value={actionReason}
                onChange={(event) => setActionReason(event.target.value)}
                placeholder={
                  ticketAction?.type === "archive"
                    ? "Old manual quote request archived."
                    : ticketAction?.type === "close"
                      ? "Customer does not want to proceed."
                      : "The previous quote has been withdrawn. We are preparing a new one."
                }
              />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={actionSubmitting} onClick={() => setTicketAction(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={actionSubmitting} onClick={submitAction}>
              {actionSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


