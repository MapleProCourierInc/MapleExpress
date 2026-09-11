import Link from "next/link"
import type { ReactNode } from "react"
import {
  AlertTriangle,
  CalendarClock,
  CircleDollarSign,
  PackageSearch,
} from "lucide-react"
import { AdminOrdersFilters } from "@/components/admin/admin-orders-filters"
import { AdminOrdersRefreshButton } from "@/components/admin/admin-orders-refresh-button"
import { AdminOrdersTable } from "@/components/admin/admin-orders-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAdminOrders, normalizeAdminOrdersPage } from "@/lib/admin-orders-service"
import type {
  AdminOrderSortBy,
  AdminOrderSortDirection,
  AdminOrdersFilters as AdminOrdersFilterValues,
} from "@/types/admin-orders"

const DEFAULT_PAGE = 0
const DEFAULT_SIZE = 10
const PAGE_SIZES = [10, 20, 50, 100, 200] as const

function getValue(values: Record<string, string | string[] | undefined>, key: string) {
  const value = values[key]
  return Array.isArray(value) ? value[0] || "" : value || ""
}

function normalizeInteger(value: string, fallback: number, min: number, max: number) {
  const normalized = value.trim()
  if (!normalized) return fallback
  const parsed = Number(normalized)
  if (!Number.isInteger(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

function normalizePageSize(value: string) {
  const parsed = Number(value)
  return PAGE_SIZES.includes(parsed as (typeof PAGE_SIZES)[number]) ? parsed : DEFAULT_SIZE
}

function normalizeDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : ""
}

function normalizeStatuses(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((status) => status.trim().toUpperCase())
        .filter(Boolean),
    ),
  )
}

function timeLabel(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Halifax",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function SummaryCard({
  label,
  value,
  helper,
  icon,
  accent = false,
}: {
  label: string
  value: string | number
  helper: string
  icon: ReactNode
  accent?: boolean
}) {
  return (
    <Card className={accent ? "border-amber-200 bg-amber-50/60" : "bg-card"}>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{helper}</p>
        </div>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground"}`}>
          {icon}
        </span>
      </CardContent>
    </Card>
  )
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolved = (await searchParams) ?? {}
  const sortByValue = getValue(resolved, "sortBy")
  const sortDirValue = getValue(resolved, "sortDir")
  const priorityValue = getValue(resolved, "priorityDelivery")

  const filters: AdminOrdersFilterValues = {
    shippingOrderId: getValue(resolved, "shippingOrderId").trim(),
    trackingId: getValue(resolved, "trackingId").trim(),
    orderStatuses: normalizeStatuses(getValue(resolved, "orderStatus")),
    paymentStatus: getValue(resolved, "paymentStatus").trim(),
    userId: getValue(resolved, "userId").trim(),
    clientUserId: getValue(resolved, "clientUserId").trim(),
    clientType: getValue(resolved, "clientType").trim(),
    priorityDelivery: priorityValue === "true" || priorityValue === "false" ? priorityValue : "",
    createdFrom: normalizeDate(getValue(resolved, "createdFrom")),
    createdTo: normalizeDate(getValue(resolved, "createdTo")),
    updatedFrom: normalizeDate(getValue(resolved, "updatedFrom")),
    updatedTo: normalizeDate(getValue(resolved, "updatedTo")),
    page: normalizeInteger(getValue(resolved, "page"), DEFAULT_PAGE, 0, Number.MAX_SAFE_INTEGER),
    size: normalizePageSize(getValue(resolved, "size")),
    sortBy: (sortByValue === "updatedAt" ? "updatedAt" : "createdAt") as AdminOrderSortBy,
    sortDir: (sortDirValue === "asc" ? "asc" : "desc") as AdminOrderSortDirection,
  }

  const result = await getAdminOrders(filters)
  const data = normalizeAdminOrdersPage(result.data, filters)
  const orders = data.orders
  const attentionCount = orders.filter((order) => order.needsAdminAttention).length
  const scheduledCount = orders.filter(
    (order) => order.pickupWindowStartDateTime && order.pickupWindowEndDateTime,
  ).length
  const pageValue = orders.reduce(
    (total, order) => {
      const amount = order.aggregatedPricing?.totalAmount
      return total + (typeof amount === "number" && Number.isFinite(amount) ? amount : 0)
    },
    0,
  )
  const currency = orders.find((order) => order.aggregatedPricing?.currency)?.aggregatedPricing?.currency || "CAD"
  const formattedPageValue = new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(pageValue)
  const filterKey = JSON.stringify(filters)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
            <Badge variant="secondary">{data.pagination.totalElements.toLocaleString()} records</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Search and review the complete order lifecycle, from draft and payment through delivery.
          </p>
        </div>
        <AdminOrdersRefreshButton loadedAt={timeLabel(new Date())} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Matching orders" value={data.pagination.totalElements.toLocaleString()} helper="Across all result pages" icon={<PackageSearch className="h-4 w-4" />} />
        <SummaryCard label="Scheduled pickups" value={scheduledCount} helper="On the current page" icon={<CalendarClock className="h-4 w-4" />} />
        <SummaryCard label="Needs attention" value={attentionCount} helper="On the current page" icon={<AlertTriangle className="h-4 w-4" />} accent={attentionCount > 0} />
        <SummaryCard label="Page value" value={formattedPageValue} helper={`${orders.length} orders on this page`} icon={<CircleDollarSign className="h-4 w-4" />} />
      </div>

      <AdminOrdersFilters key={filterKey} initialFilters={filters} />

      {result.error ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{result.error.message || "Orders could not be loaded"}</AlertTitle>
          <AlertDescription>
            Order management returned status {result.error.status || "unknown"}. Adjust the filters or try again.
          </AlertDescription>
        </Alert>
      ) : null}

      {!result.error && orders.length ? <AdminOrdersTable data={data} filters={filters} /> : null}

      {!result.error && !orders.length ? (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <PackageSearch className="h-5 w-5" />
            </span>
            <CardTitle className="pt-2">No orders found</CardTitle>
            <CardDescription>No orders match this filter combination. Clear the filters to return to the full register.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild variant="outline"><Link href="/admin/orders?page=0&size=10&sortBy=createdAt&sortDir=desc">Clear filters</Link></Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
