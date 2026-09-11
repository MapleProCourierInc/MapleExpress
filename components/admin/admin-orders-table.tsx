"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowRight,
  Box,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  Mail,
  Phone,
  ReceiptText,
  Route,
  Truck,
  UserRound,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ATLANTIC_TIME_ZONE } from "@/lib/halifax-datetime"
import { cn } from "@/lib/utils"
import type {
  AdminOrder,
  AdminOrderAddress,
  AdminOrderItem,
  AdminOrdersFilters,
  AdminOrdersPage,
} from "@/types/admin-orders"

type Props = {
  data: AdminOrdersPage
  filters: AdminOrdersFilters
}

function humanize(value?: string | null) {
  if (!value) return "Unknown"
  return value
    .replace(/^client_/i, "")
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function formatMoney(value?: number | null, currency = "CAD") {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—"
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: currency || "CAD" }).format(value)
}

function formatDateTime(value?: string | null, includeTime = true) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ATLANTIC_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(date)
}

function scheduledPickupWindow(order: AdminOrder) {
  const startValue = order.pickupWindowStartDateTime
  const endValue = order.pickupWindowEndDateTime
  if (!startValue || !endValue) return null
  const start = new Date(startValue)
  const end = new Date(endValue)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null

  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: ATLANTIC_TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(start)
  const timeFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: ATLANTIC_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  })
  return `${date}, ${timeFormatter.format(start)} – ${timeFormatter.format(end)}`
}

function orderStatusClass(status?: string | null) {
  const normalized = String(status || "").toUpperCase()
  if (["DELIVERED", "COMPLETED", "CONFIRMED"].includes(normalized)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800"
  }
  if (["FAILED", "PICKUP_FAILED", "DROP_OFF_FAILED", "RETURNED", "CANCELLED"].includes(normalized)) {
    return "border-rose-200 bg-rose-50 text-rose-800"
  }
  if (["PICKED_UP", "IN_TRANSIT", "IN_PROGRESS", "ASSIGNED"].includes(normalized)) {
    return "border-sky-200 bg-sky-50 text-sky-800"
  }
  if (["PAYMENT_PENDING", "MANUAL_QUOTE_PAYMENT_PENDING", "PENDING", "END_OF_DAY"].includes(normalized)) {
    return "border-amber-200 bg-amber-50 text-amber-800"
  }
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function paymentStatusClass(status?: string | null) {
  const normalized = String(status || "").toUpperCase()
  if (["PAID", "SUCCESS", "SUCCESSFUL", "COMPLETED", "CAPTURED", "POSTED_TO_BILLING_ACCOUNT"].includes(normalized)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800"
  }
  if (["FAILED", "CANCELLED", "DECLINED"].includes(normalized)) {
    return "border-rose-200 bg-rose-50 text-rose-800"
  }
  if (normalized.includes("PENDING") || normalized === "PENDING") {
    return "border-amber-200 bg-amber-50 text-amber-800"
  }
  return "border-slate-200 bg-white text-slate-600"
}

function StatusBadge({ value, type = "order" }: { value?: string | null; type?: "order" | "payment" }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.03em]",
        type === "order" ? orderStatusClass(value) : paymentStatusClass(value),
      )}
    >
      {humanize(value)}
    </Badge>
  )
}

function formatAddress(address?: AdminOrderAddress | null) {
  if (!address) return "Address unavailable"
  const street = [address.streetAddress, address.addressLine2].filter(Boolean).join(", ")
  const locality = [address.city, address.province, address.postalCode].filter(Boolean).join(", ")
  return [street, locality].filter(Boolean).join(" · ") || address.fullName || "Address unavailable"
}

function routeSummary(order: AdminOrder) {
  const items = order.orderItems || []
  const pickup = items[0]?.pickup?.address?.city || "Pickup"
  const destinations = Array.from(new Set(items.map((item) => item.dropoff?.address?.city).filter(Boolean)))
  if (!destinations.length) return `${pickup} → Destination unavailable`
  if (destinations.length === 1) return `${pickup} → ${destinations[0]}`
  return `${pickup} → ${destinations.length} destinations`
}

function shortOrderId(value: string) {
  const clean = value.replace(/^ShippingOrder_/i, "")
  return clean.length > 18 ? `${clean.slice(0, 8)}…${clean.slice(-7)}` : clean
}

function packageLabel(order: AdminOrder) {
  const count = order.orderItems?.length || 0
  return `${count} ${count === 1 ? "package" : "packages"}`
}

function serviceLabel(order: AdminOrder) {
  if (scheduledPickupWindow(order)) return "Scheduled"
  if (order.priorityDelivery) return "Priority ASAP"
  return "Standard ASAP"
}

function buildPageHref(filters: AdminOrdersFilters, page: number, size = filters.size) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sortBy: filters.sortBy,
    sortDir: filters.sortDir,
  })
  const entries: Array<[string, string | undefined]> = [
    ["shippingOrderId", filters.shippingOrderId],
    ["trackingId", filters.trackingId],
    ["orderStatus", filters.orderStatuses?.join(",")],
    ["paymentStatus", filters.paymentStatus],
    ["clientUserId", filters.clientUserId],
    ["userId", filters.userId],
    ["clientType", filters.clientType],
    ["priorityDelivery", filters.priorityDelivery],
    ["createdFrom", filters.createdFrom],
    ["createdTo", filters.createdTo],
    ["updatedFrom", filters.updatedFrom],
    ["updatedTo", filters.updatedTo],
  ]
  for (const [key, value] of entries) {
    if (value) params.set(key, value)
  }
  return `/admin/orders?${params.toString()}`
}

function AddressPanel({ label, address }: { label: string; address?: AdminOrderAddress | null }) {
  return (
    <div className="rounded-lg border bg-muted/15 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-sm font-semibold">{address?.fullName || address?.company || "Unknown recipient"}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{formatAddress(address)}</p>
      {address?.phoneNumber ? <p className="mt-1 text-xs text-muted-foreground">{address.phoneNumber}</p> : null}
      {address?.deliveryInstructions ? (
        <p className="mt-2 rounded-md bg-background px-2.5 py-2 text-xs text-muted-foreground">{address.deliveryInstructions}</p>
      ) : null}
    </div>
  )
}

function packageDimensions(item: AdminOrderItem) {
  const dimensions = item.packageDetails?.dimensions
  if (!dimensions) return "—"
  const values = [dimensions.length, dimensions.width, dimensions.height]
  if (!values.every((value) => typeof value === "number")) return "—"
  return `${values.join(" × ")} cm`
}

function packagePrice(item: AdminOrderItem) {
  const total = item.pricing?.totalAmount
  if (typeof total === "number" && Number.isFinite(total)) return total

  const charges = Object.values(item.pricing?.charges || {}).filter(
    (charge): charge is number => typeof charge === "number" && Number.isFinite(charge),
  )
  return charges.length ? charges.reduce((sum, charge) => sum + charge, 0) : null
}

function OrderDetailSheet({ order, onClose }: { order: AdminOrder | null; onClose: () => void }) {
  const pickupWindow = order ? scheduledPickupWindow(order) : null
  const currency = order?.aggregatedPricing?.currency || "CAD"

  return (
    <Sheet open={Boolean(order)} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-3xl">
        {order ? (
          <>
            <SheetHeader className="sticky top-0 z-10 border-b bg-background/95 px-6 py-5 pr-14 backdrop-blur">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="break-all font-mono text-xl">{order.shippingOrderId}</SheetTitle>
                <StatusBadge value={order.orderStatus} />
                {order.needsAdminAttention ? (
                  <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-amber-800">
                    <AlertTriangle className="h-3.5 w-3.5" /> Needs attention
                  </Badge>
                ) : null}
              </div>
              <SheetDescription>
                Created {formatDateTime(order.createdAt)} · {packageLabel(order)}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 p-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border bg-card p-4">
                  <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                  <p className="mt-3 text-xs text-muted-foreground">Order total</p>
                  <p className="mt-1 text-lg font-bold">{formatMoney(order.aggregatedPricing?.totalAmount, currency)}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <Box className="h-4 w-4 text-muted-foreground" />
                  <p className="mt-3 text-xs text-muted-foreground">Packages</p>
                  <p className="mt-1 text-lg font-bold">{order.orderItems?.length || 0}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <ReceiptText className="h-4 w-4 text-muted-foreground" />
                  <p className="mt-3 text-xs text-muted-foreground">Payment</p>
                  <div className="mt-1"><StatusBadge value={order.paymentStatus} type="payment" /></div>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  {order.priorityDelivery ? <Zap className="h-4 w-4 text-primary" /> : <Truck className="h-4 w-4 text-muted-foreground" />}
                  <p className="mt-3 text-xs text-muted-foreground">Service</p>
                  <p className="mt-1 text-sm font-bold">{serviceLabel(order)}</p>
                </div>
              </div>

              {pickupWindow ? (
                <div className="flex gap-3 rounded-xl border border-primary/15 bg-brand-wine-soft/45 p-4">
                  <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">Scheduled pickup window</p>
                    <p className="mt-1 font-semibold">{pickupWindow}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Atlantic time</p>
                  </div>
                </div>
              ) : null}

              <section className="rounded-xl border bg-card">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4">
                  <div>
                    <h3 className="font-semibold">Customer & account</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Contact and ownership recorded with this order.</p>
                  </div>
                  <Badge variant="secondary">{humanize(order.clientType)}</Badge>
                </div>
                <div className="grid gap-4 p-4 sm:grid-cols-2">
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 font-semibold"><UserRound className="h-4 w-4 text-muted-foreground" />{order.customerContact?.name || "Name unavailable"}</p>
                    <p className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" />{order.customerContact?.email || "Email unavailable"}</p>
                    <p className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" />{order.customerContact?.phone || "Phone unavailable"}</p>
                  </div>
                  <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs">
                    <dt className="text-muted-foreground">Client user ID</dt><dd className="break-all font-mono text-right">{order.clientUserId || "—"}</dd>
                    <dt className="text-muted-foreground">Legacy user ID</dt><dd className="break-all font-mono text-right">{order.userId || "—"}</dd>
                    <dt className="text-muted-foreground">Payment ID</dt><dd className="break-all font-mono text-right">{order.paymentId || "—"}</dd>
                    <dt className="text-muted-foreground">Tax ID</dt><dd className="break-all font-mono text-right">{order.customerContact?.taxId || "—"}</dd>
                  </dl>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">Packages & routes</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Pickup, delivery, parcel, and item pricing details.</p>
                  </div>
                  <Badge variant="outline">{packageLabel(order)}</Badge>
                </div>

                {order.orderItems?.length ? order.orderItems.map((item, index) => (
                  <article key={item.orderItemId || item.trackingId || index} className="overflow-hidden rounded-xl border bg-card">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/20 px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">{index + 1}</span>
                        <p className="font-mono text-sm font-semibold">{item.trackingId || item.orderItemId || `Package ${index + 1}`}</p>
                        <StatusBadge value={item.itemStatus} />
                      </div>
                      <p className="font-semibold">{formatMoney(packagePrice(item), item.pricing?.currency || currency)}</p>
                    </div>
                    <div className="grid gap-3 p-4 sm:grid-cols-2">
                      <AddressPanel label="Pickup" address={item.pickup?.address} />
                      <AddressPanel label="Drop-off" address={item.dropoff?.address} />
                    </div>
                    <div className="grid gap-3 border-t px-4 py-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                      <div><p className="text-muted-foreground">Description</p><p className="mt-1 font-medium">{item.description || (item.packageDetails?.type ? humanize(item.packageDetails.type) : "Package")}</p></div>
                      <div><p className="text-muted-foreground">Weight</p><p className="mt-1 font-medium">{typeof item.packageDetails?.weight === "number" ? `${item.packageDetails.weight} kg` : "—"}</p></div>
                      <div><p className="text-muted-foreground">Dimensions</p><p className="mt-1 font-medium">{packageDimensions(item)}</p></div>
                      <div><p className="text-muted-foreground">Handling</p><p className="mt-1 font-medium">{[item.isFragile ? "Fragile" : "", item.signatureRequired ? "Signature" : ""].filter(Boolean).join(" · ") || "Standard"}</p></div>
                    </div>
                  </article>
                )) : (
                  <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No package records were returned.</div>
                )}
              </section>

              <section className="rounded-xl border bg-card">
                <div className="border-b p-4">
                  <h3 className="font-semibold">Pricing summary</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Aggregated charges recorded by order management.</p>
                </div>
                <div className="space-y-2 p-4 text-sm">
                  {Object.entries(order.aggregatedPricing?.charges || {}).length ? (
                    Object.entries(order.aggregatedPricing?.charges || {}).map(([charge, amount]) => (
                      <div key={charge} className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">{humanize(charge)}</span>
                        <span className="font-medium">{formatMoney(amount, currency)}</span>
                      </div>
                    ))
                  ) : <p className="text-muted-foreground">No itemized charges were returned.</p>}
                  <Separator />
                  <div className="flex items-center justify-between gap-4 text-base font-bold">
                    <span>Total</span><span>{formatMoney(order.aggregatedPricing?.totalAmount, currency)}</span>
                  </div>
                  {order.aggregatedPricing?.customQuoteRequired ? (
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">Custom quote required</Badge>
                  ) : null}
                </div>
              </section>

              {order.notes?.length ? (
                <section className="space-y-3">
                  <div>
                    <h3 className="font-semibold">Order history</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Root status changes and audit notes.</p>
                  </div>
                  <div className="rounded-xl border bg-card px-4">
                    {[...order.notes].reverse().map((note, index) => (
                      <div key={`${note.changedAt || "note"}-${index}`} className="flex gap-3 border-b py-3 last:border-0">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{note.message || `${humanize(note.previousStatus)} → ${humanize(note.newStatus)}`}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(note.changedAt)} · {note.changedByUserId || note.source || "System"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
                <div className="text-xs text-muted-foreground">
                  <p>Confirmed: {formatDateTime(order.confirmedAt)}</p>
                  <p className="mt-1">Last updated: {formatDateTime(order.updatedAt)}</p>
                </div>
                <Button asChild variant="outline">
                  <Link href={`/admin/order-fulfillments?shippingOrderId=${encodeURIComponent(order.shippingOrderId)}&status=ALL&page=0&size=20&sortBy=createdAt&sortDir=asc`}>
                    View fulfilments <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

export function AdminOrdersTable({ data, filters }: Props) {
  const router = useRouter()
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const { pagination } = data
  const start = pagination.totalElements ? pagination.page * pagination.size + 1 : 0
  const end = Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)

  return (
    <>
      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Order register</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Showing {start.toLocaleString()}–{end.toLocaleString()} of {pagination.totalElements.toLocaleString()} matching orders
            </p>
          </div>
          <Badge variant="outline">Page {pagination.totalPages ? pagination.page + 1 : 0} of {pagination.totalPages}</Badge>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[1180px]">
            <TableHeader>
              <TableRow className="bg-muted/35 hover:bg-muted/35">
                <TableHead className="w-[190px]">Order</TableHead>
                <TableHead className="w-[210px]">Customer</TableHead>
                <TableHead className="min-w-[210px]">Route & packages</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Service</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[64px]"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.orders.map((order) => {
                const pickupWindow = scheduledPickupWindow(order)
                return (
                  <TableRow key={order.shippingOrderId} className="group">
                    <TableCell className="align-top">
                      <button type="button" className="max-w-[185px] text-left" onClick={() => setSelectedOrder(order)}>
                        <span className="block truncate font-mono text-sm font-semibold text-foreground group-hover:text-primary" title={order.shippingOrderId}>
                          {shortOrderId(order.shippingOrderId)}
                        </span>
                        <span className="mt-1.5 block text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</span>
                      </button>
                      {order.needsAdminAttention ? (
                        <Badge variant="outline" className="mt-2 gap-1 border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] text-amber-800">
                          <AlertTriangle className="h-3 w-3" /> Attention
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="align-top">
                      <p className="max-w-[200px] truncate text-sm font-medium" title={order.customerContact?.name || undefined}>{order.customerContact?.name || "Unknown customer"}</p>
                      <p className="mt-1 max-w-[200px] truncate text-xs text-muted-foreground" title={order.customerContact?.email || undefined}>{order.customerContact?.email || order.clientUserId || "—"}</p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{humanize(order.clientType)}</p>
                    </TableCell>
                    <TableCell className="align-top">
                      <p className="flex items-center gap-1.5 text-sm font-medium"><Route className="h-3.5 w-3.5 text-muted-foreground" />{routeSummary(order)}</p>
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground"><Box className="h-3.5 w-3.5" />{packageLabel(order)}</p>
                    </TableCell>
                    <TableCell className="align-top"><StatusBadge value={order.orderStatus} /></TableCell>
                    <TableCell className="align-top"><StatusBadge value={order.paymentStatus} type="payment" /></TableCell>
                    <TableCell className="align-top">
                      <div className="flex items-start gap-1.5 text-xs">
                        {pickupWindow ? <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> : order.priorityDelivery ? <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> : <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                        <div>
                          <p className="font-medium">{serviceLabel(order)}</p>
                          {pickupWindow ? <p className="mt-1 max-w-[165px] leading-4 text-muted-foreground">{pickupWindow}</p> : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-right font-semibold">
                      {formatMoney(order.aggregatedPricing?.totalAmount, order.aggregatedPricing?.currency || "CAD")}
                    </TableCell>
                    <TableCell className="align-top">
                      <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedOrder(order)} aria-label={`View order ${order.shippingOrderId}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Rows per page</span>
            <Select
              value={String(pagination.size)}
              onValueChange={(value) => router.push(buildPageHref(filters, 0, Number(value)))}
            >
              <SelectTrigger className="h-8 w-[76px] bg-background" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100, 200].map((option) => (
                  <SelectItem key={option} value={String(option)}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                {pagination.page > 0 ? (
                  <PaginationPrevious href={buildPageHref(filters, pagination.page - 1)} />
                ) : (
                  <span className="inline-flex h-9 items-center px-3 text-sm text-muted-foreground/50">Previous</span>
                )}
              </PaginationItem>
              <PaginationItem>
                <span className="inline-flex h-9 items-center px-3 text-sm font-medium">
                  {pagination.totalPages ? pagination.page + 1 : 0} / {pagination.totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                {pagination.page + 1 < pagination.totalPages ? (
                  <PaginationNext href={buildPageHref(filters, pagination.page + 1)} />
                ) : (
                  <span className="inline-flex h-9 items-center px-3 text-sm text-muted-foreground/50">Next</span>
                )}
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </section>

      <OrderDetailSheet order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </>
  )
}
