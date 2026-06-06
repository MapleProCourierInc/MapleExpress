"use client"

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileQuestion,
  FilterX,
  Inbox,
  Loader2,
  MessageCircle,
  MessageSquare,
  PackageSearch,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  XCircle,
} from "lucide-react"

import {
  MANUAL_QUOTE_OFFER_STATUSES,
  MANUAL_QUOTE_PRIORITIES,
  MANUAL_QUOTE_TICKET_STATUSES,
  acceptManualQuoteOffer,
  canCustomerReplyToManualQuote,
  createManualQuoteRequest,
  formatManualQuoteOfferStatus,
  formatManualQuotePriority,
  formatManualQuoteTicketStatus,
  getManualQuoteDetail,
  isManualQuoteClosed,
  listManualQuotes,
  markManualQuoteRead,
  rejectManualQuoteOffer,
  sendManualQuoteMessage,
  type ManualQuoteAcceptResponse,
  type ManualQuoteAttachment,
  type ManualQuoteCombinedDetailResponse,
  type ManualQuoteFilters,
  type ManualQuoteItemLine,
  type ManualQuoteMessage,
  type ManualQuoteOffer,
  type ManualQuoteOfferStatus,
  type ManualQuotePagination,
  type ManualQuotePriority,
  type ManualQuoteTicketDetail,
  type ManualQuoteTicketStatus,
  type ManualQuoteTicketSummary,
} from "@/lib/manual-quote-service"
import type { ShippingOrder } from "@/lib/order-service"
import { useToast } from "@/hooks/use-toast"
import { ConversationChatPanel } from "@/components/shared/conversation-chat-panel"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

const PAGE_SIZE = 20
const ALL_FILTER = "ALL"

type QuoteFilterTab = "ACTIVE" | "WAITING_SUPPORT" | "WAITING_ME" | "ACCEPTED" | "HISTORY" | "ALL"
type TicketStatusFilter = ManualQuoteTicketStatus | typeof ALL_FILTER
type QuoteStatusFilter = ManualQuoteOfferStatus | typeof ALL_FILTER
type QuoteOrderItem = NonNullable<ShippingOrder["orderItems"]>[number]

const filterTabs: Array<{ key: QuoteFilterTab; label: string; description: string }> = [
  { key: "ACTIVE", label: "Active", description: "Open and in-progress quote requests" },
  { key: "WAITING_SUPPORT", label: "Waiting for support", description: "Our team needs to respond" },
  { key: "WAITING_ME", label: "Waiting for me", description: "Quotes or messages waiting on you" },
  { key: "ACCEPTED", label: "Accepted", description: "Quote offers you accepted" },
  { key: "HISTORY", label: "History", description: "Archived quote requests" },
  { key: "ALL", label: "All", description: "All quote requests returned by the backend" },
]

const ticketStatusStyles: Record<ManualQuoteTicketStatus | "UNKNOWN", string> = {
  OPEN: "border-slate-200 bg-slate-50 text-slate-700",
  WAITING_FOR_ADMIN: "border-brand-maple/30 bg-brand-maple-soft text-brand-rust",
  WAITING_FOR_CUSTOMER: "border-amber-200 bg-amber-50 text-amber-900",
  IN_PROGRESS: "border-blue-200 bg-blue-50 text-blue-800",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CLOSED: "border-slate-200 bg-slate-100 text-slate-700",
  CANCELLED: "border-red-200 bg-red-50 text-red-800",
  UNKNOWN: "border-slate-200 bg-slate-50 text-slate-700",
}

const offerStatusStyles: Record<ManualQuoteOfferStatus | "UNKNOWN", string> = {
  OFFERED: "border-amber-200 bg-amber-50 text-amber-900",
  ACCEPTED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  REJECTED: "border-red-200 bg-red-50 text-red-800",
  EXPIRED: "border-slate-200 bg-slate-100 text-slate-700",
  WITHDRAWN: "border-slate-200 bg-slate-100 text-slate-700",
  SUPERSEDED: "border-blue-200 bg-blue-50 text-blue-800",
  UNKNOWN: "border-slate-200 bg-slate-50 text-slate-700",
}

const priorityStyles: Record<ManualQuotePriority | "UNKNOWN", string> = {
  LOW: "border-slate-200 bg-slate-50 text-slate-700",
  NORMAL: "border-emerald-200 bg-emerald-50 text-emerald-800",
  HIGH: "border-amber-200 bg-amber-50 text-amber-900",
  URGENT: "border-red-200 bg-red-50 text-red-800",
  UNKNOWN: "border-slate-200 bg-slate-50 text-slate-700",
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

function humanize(value?: string | null) {
  if (!value) return "N/A"
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function normalizeState(value?: string | null) {
  return (value || "").trim().toUpperCase().replace(/[\s-]+/g, "_")
}

function isKnownTicketStatus(status?: string | null): status is ManualQuoteTicketStatus {
  return MANUAL_QUOTE_TICKET_STATUSES.includes(status as ManualQuoteTicketStatus)
}

function isKnownOfferStatus(status?: string | null): status is ManualQuoteOfferStatus {
  return MANUAL_QUOTE_OFFER_STATUSES.includes(status as ManualQuoteOfferStatus)
}

function isKnownPriority(priority?: string | null): priority is ManualQuotePriority {
  return MANUAL_QUOTE_PRIORITIES.includes(priority as ManualQuotePriority)
}

function TicketStatusBadge({ status }: { status?: string | null }) {
  const key = isKnownTicketStatus(status) ? status : "UNKNOWN"

  return (
    <Badge
      variant="outline"
      className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-normal ${ticketStatusStyles[key]}`}
    >
      {formatManualQuoteTicketStatus(status)}
    </Badge>
  )
}

function OfferStatusBadge({ status }: { status?: string | null }) {
  const key = isKnownOfferStatus(status) ? status : "UNKNOWN"

  return (
    <Badge
      variant="outline"
      className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-normal ${offerStatusStyles[key]}`}
    >
      {formatManualQuoteOfferStatus(status)}
    </Badge>
  )
}

function PriorityBadge({ priority }: { priority?: string | null }) {
  const key = isKnownPriority(priority) ? priority : "UNKNOWN"

  return (
    <Badge
      variant="outline"
      className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-normal ${priorityStyles[key]}`}
    >
      {formatManualQuotePriority(priority)}
    </Badge>
  )
}

function SummaryCard({ label, value, helper, icon }: { label: string; value: number; helper: string; icon: ReactNode }) {
  return (
    <Card className="dashboard-card-surface border-slate-200 shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-1 font-mono text-xl font-bold text-slate-950">{value}</p>
          </div>
          <div className="rounded-full bg-primary/10 p-2 text-primary">{icon}</div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  )
}

function sortedOffers(offers?: ManualQuoteOffer[] | null) {
  return [...(offers || [])].sort((left, right) => {
    const leftTime = new Date(left.quotedAt || left.expiresAt || "").getTime()
    const rightTime = new Date(right.quotedAt || right.expiresAt || "").getTime()
    return (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0)
  })
}

function getCurrentOffer(ticket?: Pick<ManualQuoteTicketSummary, "manualQuoteOffers"> | null) {
  const offers = sortedOffers(ticket?.manualQuoteOffers)
  return (
    offers.find((offer) => offer.status === "OFFERED") ||
    offers.find((offer) => offer.status === "ACCEPTED") ||
    offers[0] ||
    null
  )
}

function ticketOrderId(ticket?: ManualQuoteTicketSummary | null) {
  return (
    ticket?.relatedResource?.shippingOrderId ||
    getCurrentOffer(ticket)?.shippingOrderId ||
    ticket?.shippingOrder?.shippingOrderId ||
    null
  )
}

function quoteOrderLabel(ticket?: ManualQuoteTicketSummary | null) {
  return ticket?.relatedResource?.displayLabel || ticketOrderId(ticket) || "Related order unavailable"
}

function isQuoteExpired(offer?: ManualQuoteOffer | null) {
  if (!offer?.expiresAt) return false
  const expiresAt = new Date(offer.expiresAt).getTime()
  return Number.isFinite(expiresAt) && expiresAt <= Date.now()
}

function isOrderQuoteAcceptanceCompatible(order?: ShippingOrder | null) {
  if (!order?.orderStatus) return true
  const status = normalizeState(order.orderStatus)
  const blocked = ["CANCEL", "CLOSED", "COMPLETED", "DELIVERED", "PENDING_PAYMENT", "PAID"]
  return !blocked.some((item) => status.includes(item))
}

function canActOnOffer(ticket?: ManualQuoteTicketSummary | null, offer?: ManualQuoteOffer | null, order?: ShippingOrder | null) {
  return Boolean(
    ticket &&
      offer?.quoteId &&
      offer.status === "OFFERED" &&
      !isManualQuoteClosed(ticket) &&
      !isQuoteExpired(offer) &&
      isOrderQuoteAcceptanceCompatible(order),
  )
}

function shouldExpandQuoteOffer(offer?: ManualQuoteOffer | null) {
  return offer?.status === "OFFERED" || offer?.status === "ACCEPTED"
}

function canContinueToPayment(order?: ShippingOrder | null) {
  if (!order?.shippingOrderId) return false

  const orderStatus = normalizeState(order.orderStatus)
  const paymentStatus = normalizeState(order.paymentStatus)

  if (["PAID", "SUCCESS", "SUCCESSFUL", "COMPLETED", "CAPTURED"].some((status) => paymentStatus.includes(status))) {
    return false
  }

  if (
    orderStatus.includes("PENDING_CUSTOM_QUOTE") ||
    orderStatus.includes("CUSTOM_QUOTE_NEEDED") ||
    orderStatus.includes("QUOTE_NEEDED")
  ) {
    return false
  }

  return (
    ["PENDING_PAYMENT_AFTER_MANUAL_QUOTE", "PENDING_PAYMENT", "PAYMENT_PENDING", "AWAITING_PAYMENT", "READY_FOR_PAYMENT"].some(
      (status) => orderStatus.includes(status),
    ) ||
    ["UNPAID", "PENDING", "FAILED", "PAYMENT_REQUIRED", "REQUIRES_PAYMENT"].some((status) =>
      paymentStatus.includes(status),
    )
  )
}

function chargeEntries(charges?: Record<string, number> | null) {
  return Object.entries(charges || {}).filter(([, amount]) => typeof amount === "number" && Number.isFinite(amount))
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

function orderItemPackageId(item?: QuoteOrderItem | null) {
  return item?.orderItemId || item?.trackingId || ""
}

function orderItemPackageDescription(item?: QuoteOrderItem | null, index = 0) {
  return item?.description || item?.packageDetails?.type || item?.orderItemId || item?.trackingId || `Package ${index + 1}`
}

function orderItemQuoteReason(item?: QuoteOrderItem | null) {
  return (
    item?.pricing?.customQuoteReason ||
    item?.pricing?.customQuoteReasons?.[0] ||
    item?.pricing?.customerQuoteReasons?.[0] ||
    item?.pricing?.customerQuoteResons?.[0] ||
    null
  )
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
    const id = orderItemPackageId(item)
    const manualLine = id ? manualById.get(id) : undefined
    if (manualLine) {
      usedManualIds.add(id)
      rows.push({
        key: `manual-${id || index}`,
        orderItemId: id,
        description: orderItemPackageDescription(item, index),
        pricingType: "MANUAL",
        charges: manualLine.charges,
        currency: offer?.currency || currency,
        reason: manualLine.customQuoteReason,
        explanation: manualLine.quoteReasonDescription,
      })
      return
    }

    const itemCurrency = item.pricing?.currency || currency
    rows.push({
      key: `auto-${id || index}`,
      orderItemId: id,
      description: orderItemPackageDescription(item, index),
      pricingType: "AUTO",
      charges: item.pricing?.charges,
      currency: itemCurrency,
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

function ChargeBreakdown({ charges, currency }: { charges?: Record<string, number> | null; currency?: string | null }) {
  const entries = chargeEntries(charges)
  if (!entries.length) return null

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Package charges</p>
      <div className="mt-2 space-y-1.5">
        {entries.map(([label, amount]) => (
          <div key={label} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-600">{humanize(label)}</span>
            <span className="font-mono font-semibold text-slate-950">{formatCurrency(amount, currency || "CAD")}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AttachmentUploadNotice() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/80 p-4 text-sm text-slate-600">
      <div className="flex items-start gap-3">
        <Paperclip className="mt-0.5 h-4 w-4 text-slate-500" />
        <div>
          <p className="font-medium text-slate-700">Attachments are not configured for quote replies yet.</p>
          <p className="mt-1 text-xs leading-5">
            Manual quote APIs accept S3 metadata only. Once the existing S3 upload flow is available here, files can be
            uploaded through aws-integration and attached as metadata.
          </p>
        </div>
      </div>
    </div>
  )
}

function AttachmentList({ attachments }: { attachments?: ManualQuoteAttachment[] | null }) {
  const files = attachments || []
  if (!files.length) return null

  return (
    <div className="mt-3 grid gap-2">
      {files.map((attachment, index) => {
        const key = attachment.attachmentId || attachment.storageKey || `${attachment.fileName}-${index}`
        const content = (
          <>
            <Paperclip className="h-4 w-4 text-slate-500" />
            <span className="min-w-0 flex-1 truncate">{attachment.fileName || "Attachment"}</span>
            <span className="shrink-0 text-xs text-slate-500">{formatBytes(attachment.sizeBytes)}</span>
          </>
        )

        if (attachment.downloadUrl) {
          return (
            <a
              key={key}
              href={attachment.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50"
            >
              {content}
            </a>
          )
        }

        return (
          <div
            key={key}
            className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs"
            title={attachment.storageKey || undefined}
          >
            {content}
          </div>
        )
      })}
    </div>
  )
}

function DetailMetaItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
    </div>
  )
}

function orderCurrency(order?: ShippingOrder | null) {
  return order?.aggregatedPricing?.currency || "CAD"
}

function ManualQuoteItemLines({ lines, currency }: { lines?: ManualQuoteItemLine[] | null; currency?: string | null }) {
  if (!lines?.length) return null

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-950">Quoted packages</p>
      {lines.map((line, index) => (
        <div key={line.orderItemId || index} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="font-medium text-slate-950">{line.itemDisplayName || `Quoted package ${index + 1}`}</p>
              <p className="mt-1 font-mono text-xs text-slate-500">{line.orderItemId || "Package ID unavailable"}</p>
              {line.customQuoteReason || line.quoteReasonDescription ? (
                <p className="mt-2 text-sm text-slate-600">
                  {line.quoteReasonDescription || humanize(line.customQuoteReason)}
                </p>
              ) : null}
            </div>
            <div className="text-left md:text-right">
              {typeof chargeMapValue(line.charges, "Total") === "number" ? (
                <p className="font-mono text-sm font-bold text-slate-950">
                  {formatCurrency(chargeMapValue(line.charges, "Total"), currency || "CAD")}
                </p>
              ) : null}
              {typeof chargeMapValue(line.charges, "Subtotal") === "number" ? (
                <p className="mt-1 text-xs text-slate-500">
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
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
        <PackageSearch className="mx-auto h-8 w-8 text-slate-400" />
        <p className="mt-3 text-sm font-medium">No package pricing was returned with this quote.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-950">Package pricing breakdown</p>
      {rows.map((row, index) => (
        <div key={row.key} className="rounded-lg border border-slate-200 bg-white p-3">
          {(() => {
            const rowTotal = chargeMapValue(row.charges, "Total")
            const rowSubtotal = chargeMapValue(row.charges, "Subtotal")
            return (
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-slate-950">{row.description || `Package ${index + 1}`}</p>
                <PackagePricingBadge type={row.pricingType} />
              </div>
              <p className="mt-1 font-mono text-xs text-slate-500">{row.orderItemId || "Package ID unavailable"}</p>
              {row.reason || row.explanation ? (
                <p className="mt-2 text-sm text-slate-600">
                  {row.explanation || humanize(row.reason)}
                </p>
              ) : null}
            </div>
            <div className="text-left md:text-right">
              {typeof rowTotal === "number" ? (
                <p className="font-mono text-sm font-bold text-slate-950">
                  {formatCurrency(rowTotal, row.currency || fallbackCurrency)}
                </p>
              ) : null}
              {typeof rowSubtotal === "number" ? (
                <p className="mt-1 text-xs text-slate-500">
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
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
        Full order pricing preview is not available for this offer.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">Full order pricing preview</p>
          <p className="mt-1 text-xs text-slate-500">Backend-calculated preview for the complete order.</p>
        </div>
        <p className="font-mono text-xl font-bold text-slate-950">{formatCurrency(preview.total, currency)}</p>
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-600">Subtotal</span>
          <span className="font-mono font-semibold">{formatCurrency(preview.subtotal, currency)}</span>
        </div>
        {taxEntries.map(([name, amount]) => (
          <div key={name} className="flex items-center justify-between gap-3">
            <span className="text-slate-600">{humanize(name)}</span>
            <span className="font-mono font-semibold">{formatCurrency(amount, currency)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-2">
          <span className="font-semibold text-slate-950">Total</span>
          <span className="font-mono font-bold text-slate-950">{formatCurrency(preview.total, currency)}</span>
        </div>
      </div>
    </div>
  )
}

function QuoteOfferCard({
  offer,
  ticket,
  order,
  onAccept,
  onReject,
  defaultExpanded,
}: {
  offer: ManualQuoteOffer
  ticket?: ManualQuoteTicketSummary | null
  order?: ShippingOrder | null
  onAccept: (offer: ManualQuoteOffer) => void
  onReject: (offer: ManualQuoteOffer) => void
  defaultExpanded?: boolean
}) {
  const currency = offer.orderPricingPreview?.currency || offer.currency || "CAD"
  const canAct = canActOnOffer(ticket, offer, order)
  const expired = isQuoteExpired(offer)
  const packageRows = buildMergedPackagePricingRows(offer, order)
  const [expanded, setExpanded] = useState(defaultExpanded ?? shouldExpandQuoteOffer(offer))

  useEffect(() => {
    setExpanded(defaultExpanded ?? shouldExpandQuoteOffer(offer))
  }, [defaultExpanded, offer.quoteId, offer.status])

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-base">{offer.title || "Manual quote offer"}</CardTitle>
            <CardDescription className="mt-1 font-mono">{offer.quoteId || "Quote ID unavailable"}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OfferStatusBadge status={offer.status} />
            <Button type="button" variant="outline" size="sm" onClick={() => setExpanded((current) => !current)}>
              {expanded ? "Hide details" : "View details"}
            </Button>
          </div>
        </div>
        {offer.description ? <p className="text-sm leading-6 text-slate-600">{offer.description}</p> : null}
      </CardHeader>
      {!expanded ? (
        <CardContent>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>{offer.status === "REJECTED" ? "Previous rejected quote collapsed." : "Previous quote collapsed."}</span>
              <span className="font-mono">{offer.customerDecisionAt ? `Decision ${formatDateTime(offer.customerDecisionAt)}` : `Quoted ${formatDateTime(offer.quotedAt)}`}</span>
            </div>
            {offer.customerRejectionReason ? <p className="mt-2 text-slate-900">{offer.customerRejectionReason}</p> : null}
          </div>
        </CardContent>
      ) : null}
      {expanded ? (
        <CardContent className="space-y-4">
        <OrderPricingPreviewCard offer={offer} />

        <div className="grid gap-3 md:grid-cols-2">
          <DetailMetaItem label="Quoted" value={formatDateTime(offer.quotedAt)} />
          <DetailMetaItem label="Expires" value={offer.expiresAt ? formatDateTime(offer.expiresAt) : "No expiry provided"} />
        </div>

        {expired && offer.status === "OFFERED" ? (
          <Alert className="border-amber-200 bg-amber-50 text-amber-900">
            <Clock3 className="h-4 w-4" />
            <AlertTitle>Quote expired</AlertTitle>
            <AlertDescription>This offer has passed its expiry time and cannot be accepted.</AlertDescription>
          </Alert>
        ) : null}

        <MergedPackagePricingBreakdown rows={packageRows} fallbackCurrency={currency} />

        {offer.status === "OFFERED" ? (
          <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onReject(offer)}
              disabled={!canAct}
              className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
            >
              Reject quote
            </Button>
            <Button type="button" onClick={() => onAccept(offer)} disabled={!canAct}>
              Accept quote
            </Button>
          </div>
        ) : null}
      </CardContent>
      ) : null}
    </Card>
  )
}

function MessageBubble({ message }: { message: ManualQuoteMessage }) {
  if (message.internalNote) return null

  const senderType = message.senderType || "SYSTEM"
  const isCustomer = senderType === "CUSTOMER"
  const isSystem = senderType === "SYSTEM"

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="max-w-[92%] rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-center text-xs text-slate-600">
          <span>{message.message || "System update"}</span>
          <span className="ml-2 text-slate-400">{formatDateTime(message.createdAt)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] rounded-[1.4rem] px-5 py-4 shadow-sm md:max-w-[78%] ${
          isCustomer
            ? "bg-[#b0163a] text-white"
            : "border border-slate-200 bg-white text-slate-800 shadow-[0_1px_4px_rgba(15,23,42,0.08)]"
        }`}
      >
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className={isCustomer ? "font-semibold text-white" : "font-semibold text-slate-900"}>
            {message.senderDisplayName || (isCustomer ? "You" : "Support")}
          </span>
          <span className={isCustomer ? "font-medium text-white/70" : "font-medium text-slate-500"}>
            {formatDateTime(message.createdAt)}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-base leading-7">{message.message || ""}</p>
        <div className={isCustomer ? "[&_div]:text-slate-700" : ""}>
          <AttachmentList attachments={message.attachments} />
        </div>
      </div>
    </div>
  )
}

function QuoteListItem({ ticket, onView }: { ticket: ManualQuoteTicketSummary; onView: (ticket: ManualQuoteTicketSummary) => void }) {
  const offer = getCurrentOffer(ticket)
  const orderStatus = ticket.shippingOrder?.orderStatus || ticket.orderStatus

  return (
    <div className="rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {ticket.customerUnread ? <span className="h-2.5 w-2.5 rounded-full bg-primary" title="Unread" /> : null}
            <span className="font-mono text-xs font-semibold text-slate-500">{ticket.ticketNumber || ticket.ticketId}</span>
            <TicketStatusBadge status={ticket.status} />
            <OfferStatusBadge status={offer?.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>

          <div>
            <h3 className="truncate text-base font-semibold text-slate-950">
              {ticket.subject || "Manual quote request"}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">
              {ticket.latestMessagePreview || "No quote messages yet."}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <PackageSearch className="h-3.5 w-3.5" />
              {quoteOrderLabel(ticket)}
            </span>
            {orderStatus ? <span>Order {humanize(orderStatus)}</span> : null}
            <span className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" />
              Updated {formatDateTime(ticket.updatedAt)}
            </span>
          </div>
        </div>

        <Button type="button" variant="outline" onClick={() => onView(ticket)} className="shrink-0">
          View details
        </Button>
      </div>
    </div>
  )
}

function ListLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-36 rounded-xl" />
      ))}
    </div>
  )
}

function QuoteDetailSheet({
  open,
  onOpenChange,
  ticket,
  shippingOrder,
  isLoading,
  error,
  replyMessage,
  replyError,
  isSendingReply,
  acceptedResponse,
  onReplyMessageChange,
  onSendReply,
  onAcceptOffer,
  onRejectOffer,
  onContinueToPayment,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: ManualQuoteTicketDetail | null
  shippingOrder: ShippingOrder | null
  isLoading: boolean
  error: string | null
  replyMessage: string
  replyError: string | null
  isSendingReply: boolean
  acceptedResponse: ManualQuoteAcceptResponse | null
  onReplyMessageChange: (value: string) => void
  onSendReply: () => void
  onAcceptOffer: (offer: ManualQuoteOffer) => void
  onRejectOffer: (offer: ManualQuoteOffer) => void
  onContinueToPayment: (order: ShippingOrder) => void
}) {
  const messages = (ticket?.messages || []).filter((message) => !message.internalNote)
  const offers = sortedOffers(ticket?.manualQuoteOffers)
  const currentOffer = getCurrentOffer(ticket)
  const canReply = canCustomerReplyToManualQuote(ticket)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col overflow-hidden p-0 sm:max-w-4xl lg:max-w-6xl 2xl:max-w-[1400px]">
        <SheetHeader className="border-b border-slate-200 p-6 pr-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <SheetTitle className="truncate text-2xl">{ticket?.ticketNumber || "Quote request"}</SheetTitle>
              <SheetDescription className="mt-2">
                {ticket?.subject || "Manual quote request"} | {quoteOrderLabel(ticket)}
              </SheetDescription>
            </div>
            {ticket ? (
              <div className="flex shrink-0 flex-wrap gap-2">
                <TicketStatusBadge status={ticket.status} />
                <OfferStatusBadge status={currentOffer?.status} />
              </div>
            ) : null}
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto xl:overflow-hidden">
          <div className="grid min-h-0 gap-6 p-6 xl:h-full xl:grid-cols-[minmax(0,1fr)_minmax(320px,30%)]">
            {isLoading && !ticket ? (
              <div className="space-y-4 xl:col-span-2">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-44 rounded-xl" />
                <Skeleton className="h-60 rounded-xl" />
              </div>
            ) : null}

            {error ? (
              <div className="xl:col-span-2">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Unable to load quote request</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            ) : null}

            {ticket ? (
              <>
                <div className="min-w-0 space-y-6 xl:h-full xl:overflow-y-auto xl:pr-2">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <DetailMetaItem label="Ticket" value={ticket.ticketNumber || ticket.ticketId} />
                    <DetailMetaItem label="Quote status" value={<OfferStatusBadge status={currentOffer?.status} />} />
                    <DetailMetaItem label="Created" value={formatDateTime(ticket.createdAt)} />
                    <DetailMetaItem label="Updated" value={formatDateTime(ticket.updatedAt)} />
                  </div>

                  {acceptedResponse?.acceptedQuoteId ? (
                    <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Quote accepted.</AlertTitle>
                      <AlertDescription>
                        {acceptedResponse.paymentRequired || acceptedResponse.nextAction === "CONTINUE_TO_PAYMENT"
                          ? "Quote accepted. You can now continue to payment."
                          : acceptedResponse.message || "Quote accepted."}
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  {shippingOrder && canContinueToPayment(shippingOrder) ? (
                    <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
                      <CreditCard className="h-4 w-4" />
                      <AlertTitle>Ready for payment</AlertTitle>
                      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span>Your manual quote has been applied. Continue to payment to complete this shipment.</span>
                        <Button type="button" size="sm" onClick={() => onContinueToPayment(shippingOrder)}>
                          Continue to Payment
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  <div>
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-semibold">Quote offers</h3>
                        <p className="text-sm text-muted-foreground">Review manual pricing prepared for this shipment.</p>
                      </div>
                      {currentOffer ? <OfferStatusBadge status={currentOffer.status} /> : null}
                    </div>

                    {offers.length ? (
                      <div className="space-y-4">
                        {offers.map((offer, index) => (
                          <QuoteOfferCard
                            key={offer.quoteId || index}
                            offer={offer}
                            ticket={ticket}
                            order={shippingOrder}
                            defaultExpanded={shouldExpandQuoteOffer(offer)}
                            onAccept={onAcceptOffer}
                            onReject={onRejectOffer}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                        <FileQuestion className="mx-auto h-8 w-8 text-slate-400" />
                        <p className="mt-3 text-sm font-medium">Our team is reviewing your shipment and will send a quote soon.</p>
                      </div>
                    )}
                  </div>
                </div>

                <aside className="min-h-0 min-w-0 xl:flex xl:h-full xl:flex-col">
                  <ConversationChatPanel
                    className="xl:min-h-0 xl:flex-1"
                    title="Conversation"
                    description="Messages visible to you and MapleXpress support."
                    unread={Boolean(ticket.customerUnread)}
                    messages={messages}
                    emptyTitle="No conversation yet"
                    emptyDescription="Messages about this quote will appear here."
                    replyValue={replyMessage}
                    replyPlaceholder="Write your reply to support..."
                    replyError={replyError}
                    replyDisabled={!canReply}
                    replyDisabledMessage={`This quote request is ${formatManualQuoteTicketStatus(ticket.status).toLowerCase()} and cannot receive new replies.`}
                    isSendingReply={isSendingReply}
                    composerHelper="Attachments can be added once the upload flow is configured."
                    onReplyChange={onReplyMessageChange}
                    onSendReply={onSendReply}
                    isOwnMessage={(message) => (message.senderType || "SYSTEM") === "CUSTOMER"}
                    senderFallback={(message, isOwn) => message.senderDisplayName || (isOwn ? "You" : "Support")}
                    formatDateTime={formatDateTime}
                    renderAttachments={(message, isOwn) => (
                      <div className={isOwn ? "[&_div]:text-slate-700" : ""}>
                        <AttachmentList attachments={message.attachments} />
                      </div>
                    )}
                  />
                </aside>
              </>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function RequestQuoteDialog({
  open,
  onOpenChange,
  shippingOrderId,
  error,
  isSubmitting,
  onShippingOrderIdChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  shippingOrderId: string
  error: string | null
  isSubmitting: boolean
  onShippingOrderIdChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSubmitting && onOpenChange(nextOpen)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request manual quote</DialogTitle>
          <DialogDescription>
            Manual quotes are created for shipments that already need manual pricing review.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manual-quote-order-id">Shipping order ID</Label>
            <Input
              id="manual-quote-order-id"
              value={shippingOrderId}
              onChange={(event) => onShippingOrderIdChange(event.target.value)}
              placeholder="Enter shipping order ID"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              If a quote request already exists for this order, the existing request will be opened.
            </p>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Request quote
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AcceptQuoteDialog({
  open,
  onOpenChange,
  offer,
  note,
  isSubmitting,
  onNoteChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  offer: ManualQuoteOffer | null
  note: string
  isSubmitting: boolean
  onNoteChange: (value: string) => void
  onConfirm: () => void
}) {
  const preview = offer?.orderPricingPreview
  const previewCurrency = preview?.currency || offer?.currency || "CAD"

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSubmitting && onOpenChange(nextOpen)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Accept this quote?</DialogTitle>
          <DialogDescription>
            Accepting will apply this quote to your order. If payment is required, you can continue to payment after it is accepted.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="font-medium text-slate-950">{offer?.title || "Manual quote offer"}</p>
            <p className="mt-1 font-mono text-lg font-bold text-slate-950">
              {typeof preview?.total === "number" ? formatCurrency(preview.total, previewCurrency) : "Preview unavailable"}
            </p>
            <p className="mt-1 text-xs text-slate-500">Full order pricing preview from the quote offer.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="acceptance-note">Acceptance note optional</Label>
            <Textarea
              id="acceptance-note"
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              maxLength={1000}
              placeholder="I accept this quote."
              disabled={isSubmitting}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isSubmitting || !offer?.quoteId}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Accept quote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RejectQuoteDialog({
  open,
  onOpenChange,
  offer,
  reason,
  error,
  isSubmitting,
  onReasonChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  offer: ManualQuoteOffer | null
  reason: string
  error: string | null
  isSubmitting: boolean
  onReasonChange: (value: string) => void
  onConfirm: () => void
}) {
  const preview = offer?.orderPricingPreview
  const previewCurrency = preview?.currency || offer?.currency || "CAD"

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSubmitting && onOpenChange(nextOpen)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject this quote?</DialogTitle>
          <DialogDescription>
            Rejecting this offer does not cancel the order. Our team may review and send another quote.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="font-medium text-slate-950">{offer?.title || "Manual quote offer"}</p>
            <p className="mt-1 font-mono text-lg font-bold text-slate-950">
              {typeof preview?.total === "number" ? formatCurrency(preview.total, previewCurrency) : "Preview unavailable"}
            </p>
            <p className="mt-1 text-xs text-slate-500">Full order pricing preview from the quote offer.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea
              id="reject-reason"
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              maxLength={1000}
              placeholder="This is more expensive than expected."
              disabled={isSubmitting}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting || !offer?.quoteId}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Reject quote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function filtersForTab(tab: QuoteFilterTab): Partial<ManualQuoteFilters> {
  switch (tab) {
    case "WAITING_SUPPORT":
      return { status: "WAITING_FOR_ADMIN", archived: false }
    case "WAITING_ME":
      return { status: "WAITING_FOR_CUSTOMER", archived: false }
    case "ACCEPTED":
      return { quoteStatus: "ACCEPTED", archived: false }
    case "HISTORY":
      return { archived: true }
    case "ALL":
      return {}
    case "ACTIVE":
    default:
      return { archived: false }
  }
}

function responseTicket(response: ManualQuoteCombinedDetailResponse) {
  if (!response.ticket) return null
  return {
    ...response.ticket,
    shippingOrder: response.shippingOrder ?? response.ticket.shippingOrder ?? null,
  }
}

export function Quotes() {
  const { toast } = useToast()
  const router = useRouter()

  const [tickets, setTickets] = useState<ManualQuoteTicketSummary[]>([])
  const [pagination, setPagination] = useState<ManualQuotePagination | null>(null)
  const [activeTab, setActiveTab] = useState<QuoteFilterTab>("ACTIVE")
  const [statusFilter, setStatusFilter] = useState<TicketStatusFilter>(ALL_FILTER)
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<QuoteStatusFilter>(ALL_FILTER)
  const [shippingOrderId, setShippingOrderId] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<ManualQuoteTicketDetail | null>(null)
  const [selectedShippingOrder, setSelectedShippingOrder] = useState<ShippingOrder | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [replyMessage, setReplyMessage] = useState("")
  const [replyError, setReplyError] = useState<string | null>(null)
  const [isSendingReply, setIsSendingReply] = useState(false)

  const [requestOpen, setRequestOpen] = useState(false)
  const [requestOrderId, setRequestOrderId] = useState("")
  const [requestError, setRequestError] = useState<string | null>(null)
  const [isRequesting, setIsRequesting] = useState(false)

  const [acceptOffer, setAcceptOffer] = useState<ManualQuoteOffer | null>(null)
  const [acceptanceNote, setAcceptanceNote] = useState("")
  const [isAccepting, setIsAccepting] = useState(false)
  const [lastAcceptResponse, setLastAcceptResponse] = useState<ManualQuoteAcceptResponse | null>(null)

  const [rejectOffer, setRejectOffer] = useState<ManualQuoteOffer | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [rejectError, setRejectError] = useState<string | null>(null)
  const [isRejecting, setIsRejecting] = useState(false)

  const loadQuotes = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const tabFilters = filtersForTab(activeTab)
      const data = await listManualQuotes({
        ...tabFilters,
        status: statusFilter === ALL_FILTER ? tabFilters.status : statusFilter,
        quoteStatus: quoteStatusFilter === ALL_FILTER ? tabFilters.quoteStatus : quoteStatusFilter,
        shippingOrderId: shippingOrderId.trim() || undefined,
        page,
        size: PAGE_SIZE,
        sort: "updatedAt,desc",
      })
      setTickets(data.tickets)
      setPagination(data.pagination)
    } catch (error) {
      setTickets([])
      setPagination(null)
      setLoadError(error instanceof Error ? error.message : "We could not load your quotes. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, page, quoteStatusFilter, shippingOrderId, statusFilter])

  const updateSelectedFromResponse = useCallback((response: ManualQuoteCombinedDetailResponse) => {
    const ticket = responseTicket(response)
    if (!ticket) return

    setSelectedTicket(ticket)
    setSelectedShippingOrder(response.shippingOrder ?? ticket.shippingOrder ?? null)
    setSelectedTicketId(ticket.ticketId)
    setTickets((current) => current.map((item) => (item.ticketId === ticket.ticketId ? { ...item, ...ticket } : item)))
  }, [])

  const loadQuoteDetail = useCallback(async (ticketId: string, shouldMarkRead: boolean) => {
    setIsDetailLoading(true)
    setDetailError(null)
    try {
      const data = await getManualQuoteDetail(ticketId)
      const ticket = responseTicket(data)
      if (!ticket) throw new Error("We could not load this quote request.")

      setSelectedTicket(ticket)
      setSelectedShippingOrder(data.shippingOrder ?? ticket.shippingOrder ?? null)

      if (shouldMarkRead) {
        markManualQuoteRead(ticketId)
          .then(() => {
            setSelectedTicket((current) => (current?.ticketId === ticketId ? { ...current, customerUnread: false } : current))
            setTickets((current) =>
              current.map((item) => (item.ticketId === ticketId ? { ...item, customerUnread: false } : item)),
            )
          })
          .catch(() => {
            // Non-blocking. The quote detail remains usable if read-state update fails.
          })
      }
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "We could not load this quote request.")
    } finally {
      setIsDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    loadQuotes()
  }, [loadQuotes])

  useEffect(() => {
    if (!detailOpen || !selectedTicketId) return
    loadQuoteDetail(selectedTicketId, true)
  }, [detailOpen, loadQuoteDetail, selectedTicketId])

  const filteredTickets = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return tickets

    return tickets.filter((ticket) => {
      const offer = getCurrentOffer(ticket)
      const values = [
        ticket.ticketId,
        ticket.ticketNumber,
        ticket.subject,
        ticket.latestMessagePreview,
        ticketOrderId(ticket),
        ticket.relatedResource?.displayLabel,
        ticket.status,
        ticket.priority,
        offer?.quoteId,
        offer?.status,
      ]
      return values.some((value) => value?.toString().toLowerCase().includes(query))
    })
  }, [searchTerm, tickets])

  const summary = useMemo(() => {
    return tickets.reduce(
      (counts, ticket) => {
        const offer = getCurrentOffer(ticket)
        const isClosed = ["RESOLVED", "CLOSED", "CANCELLED"].includes(ticket.status || "") || ticket.archived
        const hasAcceptedOffer = ticket.manualQuoteOffers?.some((item) => item.status === "ACCEPTED")
        const hasRejectedOffer = ticket.manualQuoteOffers?.some((item) => item.status === "REJECTED")

        if (!isClosed && !hasAcceptedOffer) counts.pending += 1
        if (ticket.status === "WAITING_FOR_ADMIN") counts.waitingForSupport += 1
        if (ticket.status === "WAITING_FOR_CUSTOMER" || offer?.status === "OFFERED") counts.waitingForMe += 1
        if (hasAcceptedOffer) counts.accepted += 1
        if (isClosed || hasRejectedOffer) counts.rejectedClosed += 1

        return counts
      },
      { pending: 0, waitingForSupport: 0, waitingForMe: 0, accepted: 0, rejectedClosed: 0 },
    )
  }, [tickets])

  const hasActiveFilters =
    activeTab !== "ACTIVE" ||
    statusFilter !== ALL_FILTER ||
    quoteStatusFilter !== ALL_FILTER ||
    Boolean(shippingOrderId.trim()) ||
    Boolean(searchTerm.trim())

  const activeFilterSummary = useMemo(() => {
    const parts: string[] = []
    const tabLabel = filterTabs.find((tab) => tab.key === activeTab)?.label
    if (activeTab !== "ACTIVE" && tabLabel) parts.push(`View: ${tabLabel}`)
    if (statusFilter !== ALL_FILTER) parts.push(`Status: ${formatManualQuoteTicketStatus(statusFilter)}`)
    if (quoteStatusFilter !== ALL_FILTER) parts.push(`Quote: ${formatManualQuoteOfferStatus(quoteStatusFilter)}`)
    if (shippingOrderId.trim()) parts.push(`Order: ${shippingOrderId.trim()}`)
    if (searchTerm.trim()) parts.push(`Search: ${searchTerm.trim()}`)
    return parts
  }, [activeTab, quoteStatusFilter, searchTerm, shippingOrderId, statusFilter])

  const resetPageAndSet = <T,>(setter: (value: T) => void, value: T) => {
    setPage(0)
    setter(value)
  }

  const clearFilters = () => {
    setActiveTab("ACTIVE")
    setStatusFilter(ALL_FILTER)
    setQuoteStatusFilter(ALL_FILTER)
    setShippingOrderId("")
    setSearchTerm("")
    setPage(0)
  }

  const openQuote = (ticket: ManualQuoteTicketSummary) => {
    setSelectedTicket(ticket as ManualQuoteTicketDetail)
    setSelectedShippingOrder(ticket.shippingOrder ?? null)
    setSelectedTicketId(ticket.ticketId)
    setReplyMessage("")
    setReplyError(null)
    setDetailError(null)
    setLastAcceptResponse(null)
    setDetailOpen(true)
  }

  const handleRequestQuote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedOrderId = requestOrderId.trim()
    if (!trimmedOrderId) {
      setRequestError("Shipping order ID is required.")
      return
    }

    setIsRequesting(true)
    setRequestError(null)
    try {
      const response = await createManualQuoteRequest(trimmedOrderId)
      const ticket = responseTicket(response)
      toast({ title: "Manual quote request created.", description: "The quote request is ready for review." })
      setRequestOpen(false)
      setRequestOrderId("")
      loadQuotes()

      if (ticket) {
        setSelectedTicket(ticket)
        setSelectedShippingOrder(response.shippingOrder ?? ticket.shippingOrder ?? null)
        setSelectedTicketId(ticket.ticketId)
        setDetailOpen(true)
      }
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Failed to request a manual quote.")
    } finally {
      setIsRequesting(false)
    }
  }

  const handleSendReply = async () => {
    if (!selectedTicket?.ticketId) return
    const trimmedMessage = replyMessage.trim()
    if (!trimmedMessage) {
      setReplyError("Reply message is required.")
      return
    }

    setIsSendingReply(true)
    setReplyError(null)
    try {
      const response = await sendManualQuoteMessage(selectedTicket.ticketId, {
        message: trimmedMessage,
        attachments: [],
      })
      updateSelectedFromResponse(response)
      setReplyMessage("")
      toast({ title: "Message sent", description: "Your message has been added to the quote request." })
      loadQuotes()
    } catch (error) {
      setReplyError(error instanceof Error ? error.message : "We could not send your message. Please try again.")
    } finally {
      setIsSendingReply(false)
    }
  }

  const handleAcceptQuote = async () => {
    if (!selectedTicket?.ticketId || !acceptOffer?.quoteId) return

    setIsAccepting(true)
    try {
      const response = await acceptManualQuoteOffer(selectedTicket.ticketId, acceptOffer.quoteId, {
        acceptanceNote: acceptanceNote.trim() || undefined,
      })
      setLastAcceptResponse(response)
      updateSelectedFromResponse(response)
      setAcceptOffer(null)
      setAcceptanceNote("")
      toast({
        title: "Quote accepted.",
        description:
          response.paymentRequired || response.nextAction === "CONTINUE_TO_PAYMENT"
            ? "You can now continue to payment."
            : response.message || "The quote has been accepted.",
      })
      loadQuotes()
    } catch (error) {
      toast({
        title: "We could not accept this quote.",
        description: error instanceof Error ? error.message : "It may have expired or changed. Please refresh and try again.",
        variant: "destructive",
      })
    } finally {
      setIsAccepting(false)
    }
  }

  const handleRejectQuote = async () => {
    if (!selectedTicket?.ticketId || !rejectOffer?.quoteId) return
    const trimmedReason = rejectReason.trim()
    if (!trimmedReason) {
      setRejectError("Rejection reason is required.")
      return
    }

    setIsRejecting(true)
    setRejectError(null)
    try {
      const response = await rejectManualQuoteOffer(selectedTicket.ticketId, rejectOffer.quoteId, { reason: trimmedReason })
      updateSelectedFromResponse(response)
      setRejectOffer(null)
      setRejectReason("")
      toast({ title: "Quote rejected.", description: "Our team may review and send another quote." })
      loadQuotes()
    } catch (error) {
      setRejectError(error instanceof Error ? error.message : "We could not reject this quote. Please try again.")
    } finally {
      setIsRejecting(false)
    }
  }

  const handleContinueToPayment = (order: ShippingOrder) => {
    router.push(`/ship-now?shippingOrderId=${encodeURIComponent(order.shippingOrderId)}`)
  }

  const totalPages = pagination?.totalPages ?? 0
  const totalElements = pagination?.totalElements ?? tickets.length
  const activeTabConfig = filterTabs.find((tab) => tab.key === activeTab)

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quotes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage custom quote requests for shipments that need manual review.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={loadQuotes} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button type="button" onClick={() => setRequestOpen(true)}>
            <Plus className="h-4 w-4" />
            Request manual quote
          </Button>
        </div>
      </div>

      <Card className="dashboard-card-surface border-slate-200 shadow-sm">
        <CardContent className="p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-950">Summary</span>
                <Badge variant="outline">Pending: {summary.pending}</Badge>
                <Badge variant="outline">Waiting for me: {summary.waitingForMe}</Badge>
                <Badge variant="outline">Accepted: {summary.accepted}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Counts are calculated from the currently loaded result set.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setSummaryOpen((current) => !current)}>
              {summaryOpen ? "Hide summary" : "Show summary"}
            </Button>
          </div>
          {summaryOpen ? (
            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
              <SummaryCard
                label="Pending quotes"
                value={summary.pending}
                helper="Calculated from the current result set"
                icon={<FileQuestion className="h-5 w-5" />}
              />
              <SummaryCard
                label="Waiting for support"
                value={summary.waitingForSupport}
                helper="Our team needs to respond"
                icon={<Clock3 className="h-5 w-5" />}
              />
              <SummaryCard
                label="Waiting for my response"
                value={summary.waitingForMe}
                helper="Quotes or messages waiting on you"
                icon={<MessageSquare className="h-5 w-5" />}
              />
              <SummaryCard
                label="Accepted quotes"
                value={summary.accepted}
                helper="Accepted in the current result set"
                icon={<CheckCircle2 className="h-5 w-5" />}
              />
              <SummaryCard
                label="Rejected/closed quotes"
                value={summary.rejectedClosed}
                helper="Rejected or closed in this result set"
                icon={<XCircle className="h-5 w-5" />}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="dashboard-card-surface border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col gap-3 pb-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-lg">Filters</CardTitle>
            <CardDescription>
              {activeFilterSummary.length
                ? activeFilterSummary.join(" | ")
                : activeTabConfig?.description || "Filter quote requests"}
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setFiltersOpen((current) => !current)}>
            {filtersOpen ? "Hide filters" : "Show filters"}
          </Button>
        </CardHeader>
        {filtersOpen ? (
        <CardContent className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filterTabs.map((tab) => (
              <Button
                key={tab.key}
                type="button"
                variant={activeTab === tab.key ? "default" : "outline"}
                onClick={() => resetPageAndSet(setActiveTab, tab.key)}
                className="whitespace-nowrap"
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(value) => resetPageAndSet(setStatusFilter, value as TicketStatusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>All statuses</SelectItem>
                  {MANUAL_QUOTE_TICKET_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatManualQuoteTicketStatus(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quote status</Label>
              <Select value={quoteStatusFilter} onValueChange={(value) => resetPageAndSet(setQuoteStatusFilter, value as QuoteStatusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="All quote statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>All quote statuses</SelectItem>
                  {MANUAL_QUOTE_OFFER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatManualQuoteOfferStatus(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quote-order-filter">Shipping order ID</Label>
              <Input
                id="quote-order-filter"
                value={shippingOrderId}
                onChange={(event) => resetPageAndSet(setShippingOrderId, event.target.value)}
                placeholder="Optional order filter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quote-search">Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="quote-search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Ticket, order, or message"
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={clearFilters} disabled={!hasActiveFilters}>
              <FilterX className="h-4 w-4" />
              Clear filters
            </Button>
          </div>
        </CardContent>
        ) : null}
      </Card>

      {loadError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load quotes</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="dashboard-card-surface border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg">Quote requests</CardTitle>
            <CardDescription>
              {totalElements ? `${totalElements} quote request${totalElements === 1 ? "" : "s"} found` : "No quote requests found"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ListLoading />
          ) : filteredTickets.length ? (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <QuoteListItem key={ticket.ticketId} ticket={ticket} onView={openQuote} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Inbox className="h-7 w-7" />
              </div>
              <h2 className="text-lg font-semibold">
                {tickets.length ? "No quote requests match your search" : "You do not have any manual quote requests yet."}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                {tickets.length
                  ? "Try clearing filters or searching for another ticket or order number."
                  : "If a shipment needs manual review, it will appear here."}
              </p>
              <div className="mt-5 flex justify-center gap-2">
                {tickets.length ? (
                  <Button type="button" variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : null}
                <Button type="button" onClick={() => setRequestOpen(true)}>
                  Request manual quote
                </Button>
              </div>
            </div>
          )}

          {pagination && totalPages > 1 ? (
            <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={page <= 0 || isLoading}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={page >= totalPages - 1 || isLoading}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <QuoteDetailSheet
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) {
            setReplyMessage("")
            setReplyError(null)
            setLastAcceptResponse(null)
          }
        }}
        ticket={selectedTicket}
        shippingOrder={selectedShippingOrder}
        isLoading={isDetailLoading}
        error={detailError}
        replyMessage={replyMessage}
        replyError={replyError}
        isSendingReply={isSendingReply}
        acceptedResponse={lastAcceptResponse}
        onReplyMessageChange={(value) => {
          setReplyMessage(value)
          if (replyError) setReplyError(null)
        }}
        onSendReply={handleSendReply}
        onAcceptOffer={(offer) => {
          setAcceptOffer(offer)
          setAcceptanceNote("")
        }}
        onRejectOffer={(offer) => {
          setRejectOffer(offer)
          setRejectReason("")
          setRejectError(null)
        }}
        onContinueToPayment={handleContinueToPayment}
      />

      <RequestQuoteDialog
        open={requestOpen}
        onOpenChange={(open) => {
          setRequestOpen(open)
          if (!open) {
            setRequestError(null)
            setRequestOrderId("")
          }
        }}
        shippingOrderId={requestOrderId}
        error={requestError}
        isSubmitting={isRequesting}
        onShippingOrderIdChange={(value) => {
          setRequestOrderId(value)
          if (requestError) setRequestError(null)
        }}
        onSubmit={handleRequestQuote}
      />

      <AcceptQuoteDialog
        open={Boolean(acceptOffer)}
        onOpenChange={(open) => {
          if (!open) setAcceptOffer(null)
        }}
        offer={acceptOffer}
        note={acceptanceNote}
        isSubmitting={isAccepting}
        onNoteChange={setAcceptanceNote}
        onConfirm={handleAcceptQuote}
      />

      <RejectQuoteDialog
        open={Boolean(rejectOffer)}
        onOpenChange={(open) => {
          if (!open) setRejectOffer(null)
        }}
        offer={rejectOffer}
        reason={rejectReason}
        error={rejectError}
        isSubmitting={isRejecting}
        onReasonChange={(value) => {
          setRejectReason(value)
          if (rejectError) setRejectError(null)
        }}
        onConfirm={handleRejectQuote}
      />
    </div>
  )
}
