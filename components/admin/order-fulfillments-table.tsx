import Link from "next/link"
import {
  CalendarClock,
  ExternalLink,
  MapPin,
  Package,
  Route,
  Truck,
  UserRound,
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
import {
  ADMIN_ATTENTION_FULFILLMENT_STATUSES,
  type FulfillmentAddress,
  type OrderFulfillment,
  type OrderFulfillmentQuery,
  type OrderFulfillmentsResponse,
} from "@/types/admin-order-fulfillments"

type OrderFulfillmentsTableProps = {
  data: OrderFulfillmentsResponse
  filters: OrderFulfillmentQuery
}

function field(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "-"
  return String(value)
}

function humanize(value?: string | null) {
  if (!value) return "Unknown"
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function formatDateTime(value?: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  const hh = String(date.getHours()).padStart(2, "0")
  const min = String(date.getMinutes()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`
}

function formatDistanceKm(value?: number | null) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null
  const kilometers = value / 1000
  if (kilometers > 0 && kilometers < 0.01) return "<0.01 km"
  return `${kilometers.toLocaleString(undefined, { maximumFractionDigits: 2 })} km`
}

function formatAddress(address?: FulfillmentAddress | null) {
  if (!address) return "-"
  const line = [address.streetAddress, address.addressLine2].filter(Boolean).join(", ")
  const city = [address.city, address.province, address.postalCode].filter(Boolean).join(", ")
  return [line, city].filter(Boolean).join(" | ") || field(address.fullName)
}

function statusTone(status?: string | null): "green" | "yellow" | "red" | "blue" | "neutral" {
  const normalized = String(status || "").toUpperCase()

  if (["DELIVERED"].includes(normalized)) return "green"
  if (["FAILED", "PICKUP_FAILED", "DROP_OFF_FAILED", "CANCELLED", "RETURNED"].includes(normalized)) return "red"
  if (["PICKED_UP", "IN_TRANSIT", "IN_PROGRESS", "END_OF_DAY"].includes(normalized)) return "blue"
  if (["ASSIGNED", "CREATED", "CONFIRMED", "SCHEDULED", "PENDING", "PAYMENT_PENDING", "LABEL_CREATED"].includes(normalized)) {
    return "yellow"
  }
  return "neutral"
}

function statusBadgeClass(status?: string | null) {
  const tone = statusTone(status)

  if (tone === "green") {
    return "border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
  }
  if (tone === "yellow") {
    return "border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
  }
  if (tone === "red") {
    return "border-rose-200 bg-rose-100 text-rose-900 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-200"
  }
  if (tone === "blue") {
    return "border-sky-200 bg-sky-100 text-sky-900 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-200"
  }

  return "border-muted bg-muted text-foreground"
}

function packageSummary(item: OrderFulfillment) {
  const dims = item.packageDimensions
  const dimensionText =
    dims?.length || dims?.width || dims?.height
      ? [dims.length, dims.width, dims.height].map((value) => (value === null || value === undefined ? "-" : value)).join(" x ")
      : null

  return [item.itemDescription, dimensionText].filter(Boolean).join(" | ") || "-"
}

function FulfillmentRow({ item }: { item: OrderFulfillment }) {
  const distance = formatDistanceKm(item.distanceToDelivery)
  const isAssigned = Boolean(item.assignedDriverUserId || item.assignedDriverName)

  return (
    <article className="p-4 transition-colors hover:bg-muted/30">
      <div className="grid gap-4 2xl:grid-cols-[minmax(220px,0.9fr)_minmax(320px,1.25fr)_minmax(230px,0.9fr)_minmax(240px,0.9fr)]">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={statusBadgeClass(item.status)}>
              {humanize(item.status)}
            </Badge>
            <Badge variant={isAssigned ? "secondary" : "outline"}>{isAssigned ? "Assigned" : "Unassigned"}</Badge>
          </div>
          <div className="min-w-0">
            <p className="break-words text-base font-semibold leading-tight">{field(item.trackingNumber)}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">Fulfilment {field(item.id)}</p>
            <p className="truncate text-xs text-muted-foreground">Shipping order {field(item.shippingOrderId)}</p>
            {item.sourceOrderId ? <p className="truncate text-xs text-muted-foreground">Source item {item.sourceOrderId}</p> : null}
          </div>
          {item.shippingLabelURL ? (
            <Button asChild size="sm" variant="outline" className="h-8">
              <Link href={item.shippingLabelURL} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                Label
              </Link>
            </Button>
          ) : null}
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex items-start gap-2">
            <Route className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 space-y-3">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Pickup</p>
                <p className="break-words text-sm font-medium">{formatAddress(item.pickup?.address)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Dropoff</p>
                <p className="break-words text-sm font-medium">{formatAddress(item.dropoff?.address)}</p>
              </div>
              {distance ? (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{distance} to delivery</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex items-start gap-2">
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Created</span> {formatDateTime(item.createdAt)}
              </p>
              <p>
                <span className="text-muted-foreground">Pickup</span>{" "}
                {formatDateTime(item.pickup?.scheduledTime || item.pickup?.pickupTime)}
              </p>
              <p>
                <span className="text-muted-foreground">Dropoff</span>{" "}
                {formatDateTime(item.dropoff?.scheduledTime || item.dropoff?.dropoffTime)}
              </p>
              {item.deliveredAt ? (
                <p>
                  <span className="text-muted-foreground">Delivered</span> {formatDateTime(item.deliveredAt)}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{field(item.assignedDriverName)}</p>
              <p className="truncate text-xs text-muted-foreground">{field(item.assignedDriverUserId)}</p>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex items-start gap-2">
            <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="break-words text-sm font-medium">{field(item.customerContact?.name)}</p>
              <p className="break-words text-xs text-muted-foreground">{field(item.customerContact?.email)}</p>
              <p className="break-words text-xs text-muted-foreground">{field(item.customerContact?.phone)}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Package className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="break-words text-sm">{packageSummary(item)}</p>
              {item.signatureRequired ? (
                <p className="text-xs text-muted-foreground">Signature {humanize(item.signatureStatus)}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export function OrderFulfillmentsTable({ data, filters }: OrderFulfillmentsTableProps) {
  const buildHref = (page: number) => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("size", String(filters.size))
    params.set("sortBy", filters.sortBy || "createdAt")
    params.set("sortDir", filters.sortDir || "asc")

    if (filters.trackingNumber) params.set("trackingNumber", filters.trackingNumber)
    if (filters.shippingOrderId) params.set("shippingOrderId", filters.shippingOrderId)
    if (filters.status) params.set("status", filters.status)
    if (filters.assignedDriverUserId) params.set("assignedDriverUserId", filters.assignedDriverUserId)
    if (filters.assignedDriverName) params.set("assignedDriverName", filters.assignedDriverName)

    return `/admin/order-fulfillments?${params.toString()}`
  }

  const statusFilter = filters.status || ADMIN_ATTENTION_FULFILLMENT_STATUSES.join(",")
  const statusParts = statusFilter.split(",").filter(Boolean)
  const statusSet = new Set(statusParts)
  const isDefaultAttention =
    statusFilter !== "ALL" &&
    statusParts.length === ADMIN_ATTENTION_FULFILLMENT_STATUSES.length &&
    ADMIN_ATTENTION_FULFILLMENT_STATUSES.every((status) => statusSet.has(status))
  const statusScope = statusFilter === "ALL" ? "All statuses" : isDefaultAttention ? "Admin attention" : statusFilter

  return (
    <section className="overflow-hidden rounded-md border bg-card shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b p-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-base font-semibold">Fulfilment Queue</h2>
          <p className="text-sm text-muted-foreground">
            Showing {data.items.length} of {data.totalElements} records
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{statusScope}</Badge>
          <Badge variant="outline">Page {data.totalPages === 0 ? 0 : data.page + 1} of {data.totalPages}</Badge>
        </div>
      </div>

      <div className="divide-y">
        {data.items.map((item, index) => (
          <FulfillmentRow key={item.id || item.trackingNumber || `${item.shippingOrderId}-${index}`} item={item} />
        ))}
      </div>

      <div className="flex flex-col items-center justify-between gap-2 border-t p-3 sm:flex-row">
        <span className="text-sm text-muted-foreground">
          Page {data.totalPages === 0 ? 0 : data.page + 1} of {data.totalPages}
        </span>
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              {data.page > 0 ? (
                <PaginationPrevious href={buildHref(data.page - 1)} />
              ) : (
                <span className="inline-flex h-9 items-center rounded-md px-3 text-sm text-muted-foreground">Previous</span>
              )}
            </PaginationItem>
            <PaginationItem>
              {data.page + 1 < data.totalPages ? (
                <PaginationNext href={buildHref(data.page + 1)} />
              ) : (
                <span className="inline-flex h-9 items-center rounded-md px-3 text-sm text-muted-foreground">Next</span>
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </section>
  )
}
