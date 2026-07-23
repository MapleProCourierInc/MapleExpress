import { AlertCircle } from "lucide-react"
import { OrderFulfillmentFilters } from "@/components/admin/order-fulfillment-filters"
import { OrderFulfillmentDispatchBoard } from "@/components/admin/order-fulfillment-dispatch-board"
import { OrderFulfillmentsRefreshButton } from "@/components/admin/order-fulfillments-refresh-button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getActiveDriverSessions } from "@/lib/admin-driver-sessions-service"
import { getAdminOrderFulfillments } from "@/lib/admin-order-fulfillments-service"
import {
  ADMIN_ATTENTION_FULFILLMENT_STATUSES,
  FULFILLMENT_STATUS_OPTIONS,
  type FulfillmentStatus,
  type OrderFulfillmentQuery,
  type SortDirection,
} from "@/types/admin-order-fulfillments"

const DEFAULT_PAGE = 0
const DEFAULT_SIZE = 20
const DEFAULT_STATUS = ADMIN_ATTENTION_FULFILLMENT_STATUSES.join(",")

function getValue(searchParams: Record<string, string | string[] | undefined>, key: string) {
  const value = searchParams[key]
  if (Array.isArray(value)) return value[0] || ""
  return value || ""
}

function normalizeNumber(value: string | undefined, fallback: number, max?: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return fallback
  if (max !== undefined) return Math.min(parsed, max)
  return parsed
}

function normalizeStatus(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return DEFAULT_STATUS
  if (trimmed.toUpperCase() === "ALL") return "ALL"

  const supported = new Set<string>(FULFILLMENT_STATUS_OPTIONS)
  const statuses = trimmed
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter((item): item is FulfillmentStatus => supported.has(item))

  return statuses.length ? Array.from(new Set(statuses)).join(",") : DEFAULT_STATUS
}

function normalizeSortDir(value: string): SortDirection {
  return value === "desc" ? "desc" : "asc"
}

function formatLoadedAt(date: Date) {
  const hh = String(date.getHours()).padStart(2, "0")
  const min = String(date.getMinutes()).padStart(2, "0")
  const sec = String(date.getSeconds()).padStart(2, "0")
  return `${hh}:${min}:${sec}`
}

function orderFulfillmentErrorDescription(status?: string) {
  if (status && ["502", "503", "504"].includes(String(status))) {
    return "The fulfilment service is restarting or temporarily unavailable. Refresh again in a moment."
  }

  return `Backend returned status ${status || "unknown"}. Adjust filters or refresh the page.`
}

export default async function AdminOrderFulfillmentsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolved = (await searchParams) ?? {}

  const filters: OrderFulfillmentQuery = {
    trackingNumber: getValue(resolved, "trackingNumber").trim(),
    shippingOrderId: getValue(resolved, "shippingOrderId").trim(),
    status: normalizeStatus(getValue(resolved, "status")),
    assignedDriverUserId: getValue(resolved, "assignedDriverUserId").trim(),
    assignedDriverName: getValue(resolved, "assignedDriverName").trim(),
    page: normalizeNumber(getValue(resolved, "page"), DEFAULT_PAGE),
    size: normalizeNumber(getValue(resolved, "size"), DEFAULT_SIZE, 100) || DEFAULT_SIZE,
    sortBy: "createdAt",
    sortDir: normalizeSortDir(getValue(resolved, "sortDir")),
  }

  const [fulfillmentResult, driverSessionsResult] = await Promise.all([
    getAdminOrderFulfillments(filters),
    getActiveDriverSessions(),
  ])

  const { data, error } = fulfillmentResult
  const activeDriverCount = driverSessionsResult.data?.items.length ?? 0
  const unassignedCount = data?.items.filter((item) => !item.assignedDriverUserId && !item.assignedDriverName).length ?? 0
  const currentPageCount = data?.items.length ?? 0

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div>
            <h1 className="text-2xl font-bold">Order Fulfilments</h1>
            <p className="text-muted-foreground">Review fulfilment work queues beside active driver sessions.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{data?.totalElements ?? 0} total records</Badge>
            <Badge variant="outline">{currentPageCount} on this page</Badge>
            <Badge variant={unassignedCount ? "default" : "outline"}>{unassignedCount} unassigned</Badge>
            <Badge variant="outline">{activeDriverCount} active drivers</Badge>
          </div>
        </div>
        <OrderFulfillmentsRefreshButton loadedAt={formatLoadedAt(new Date())} />
      </div>

      <OrderFulfillmentFilters
        initialFilters={{
          trackingNumber: filters.trackingNumber || "",
          shippingOrderId: filters.shippingOrderId || "",
          status: filters.status || DEFAULT_STATUS,
          assignedDriverUserId: filters.assignedDriverUserId || "",
          assignedDriverName: filters.assignedDriverName || "",
          size: filters.size,
          sortDir: filters.sortDir,
        }}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{error.message || "Failed to load order fulfilments"}</AlertTitle>
          <AlertDescription>{orderFulfillmentErrorDescription(error.status)}</AlertDescription>
        </Alert>
      ) : null}

      {!error && data && data.items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No fulfilments found</CardTitle>
            <CardDescription>Try widening the status scope or clearing exact-match filters.</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {!error && data && data.items.length > 0 ? (
        <OrderFulfillmentDispatchBoard
          data={data}
          filters={filters}
          driverSessionsData={driverSessionsResult.data}
          driverSessionsError={driverSessionsResult.error}
          driverSessionsTextError={driverSessionsResult.textError}
        />
      ) : null}

      {!error && !data ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load fulfilments</CardTitle>
            <CardDescription>Please refresh or adjust the filters.</CardDescription>
          </CardHeader>
        </Card>
      ) : null}
    </div>
  )
}
