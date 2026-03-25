"use client"

import { useEffect, useMemo, useState } from "react"
import { getClientOrders, type ClientOrder, type ClientOrdersFilters } from "@/lib/order-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, CalendarClock, MapPinned, Package, RefreshCw, Route, Truck } from "lucide-react"

type SortOption = "newest" | "oldest" | "updated"

const DEFAULT_PAGE_SIZE = 10
const ORDER_STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "payment_pending", label: "Payment pending" },
  { value: "payment_failed", label: "Payment failed" },
  { value: "confirmed", label: "Confirmed" },
  { value: "pending", label: "Pending" },
  { value: "label_created", label: "Label created" },
  { value: "scheduled", label: "Scheduled" },
  { value: "created", label: "Created" },
  { value: "assigned", label: "Assigned" },
  { value: "picked_up", label: "Picked up" },
  { value: "in_transit", label: "In transit" },
  { value: "delivered", label: "Delivered" },
  { value: "pickup_failed", label: "Pickup failed" },
  { value: "drop_off_failed", label: "Drop-off failed" },
  { value: "returned", label: "Returned" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "end_of_day", label: "End of day" },
  { value: "in_progress", label: "In progress" },
]

function getSortParams(sort: SortOption): Pick<ClientOrdersFilters, "sortBy" | "sortDir"> {
  switch (sort) {
    case "oldest":
      return { sortBy: "createdAt", sortDir: "asc" }
    case "updated":
      return { sortBy: "updatedAt", sortDir: "desc" }
    case "newest":
    default:
      return { sortBy: "createdAt", sortDir: "desc" }
  }
}

function getStatusPill(status?: string | null) {
  const normalized = (status || "").toLowerCase()

  const successSet = new Set(["confirmed", "delivered"])
  const warningSet = new Set(["payment_pending", "pending"])
  const progressSet = new Set(["created", "assigned", "picked_up", "in_transit", "scheduled", "label_created", "in_progress"])
  const dangerSet = new Set(["payment_failed", "pickup_failed", "drop_off_failed", "failed", "cancelled"])
  const neutralSet = new Set(["draft", "returned", "end_of_day"])

  let classes = "bg-muted text-muted-foreground border-border"

  if (successSet.has(normalized)) {
    classes = "bg-emerald-100 text-emerald-800 border-emerald-200"
  } else if (progressSet.has(normalized)) {
    classes = "bg-sky-100 text-sky-900 border-sky-200"
  } else if (neutralSet.has(normalized)) {
    classes = "bg-slate-100 text-slate-700 border-slate-200"
  } else if (dangerSet.has(normalized)) {
    classes = "bg-rose-100 text-rose-800 border-rose-200"
  } else if (warningSet.has(normalized)) {
    classes = "bg-amber-100 text-amber-900 border-amber-200"
  }

  const label = status
    ? status
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "Unknown"

  return (
    <Badge variant="outline" className={`h-6 rounded-md px-2 text-[11px] font-medium border ${classes}`}>
      {label}
    </Badge>
  )
}

function ShipmentSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="rounded-lg border bg-background p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Shipments() {
  const [orders, setOrders] = useState<ClientOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const [orderStatus, setOrderStatus] = useState("all")
  const [createdFrom, setCreatedFrom] = useState("")
  const [createdTo, setCreatedTo] = useState("")
  const [sortOption, setSortOption] = useState<SortOption>("newest")

  const sortParams = useMemo(() => getSortParams(sortOption), [sortOption])

  const filters = useMemo<ClientOrdersFilters>(() => {
    return {
      orderStatus: orderStatus !== "all" ? orderStatus : undefined,
      createdFrom: createdFrom || undefined,
      createdTo: createdTo || undefined,
      page,
      size: DEFAULT_PAGE_SIZE,
      sortBy: sortParams.sortBy,
      sortDir: sortParams.sortDir,
    }
  }, [orderStatus, createdFrom, createdTo, page, sortParams])

  const fetchOrders = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await getClientOrders(filters)
      setOrders(response.orders)
      setTotalPages(response.pagination.totalPages)
      setTotalElements(response.pagination.totalElements)
    } catch (err) {
      console.error("Failed to fetch client orders", err)
      setError("We couldn't load your shipments right now. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [filters])

  const handleResetFilters = () => {
    setOrderStatus("all")
    setCreatedFrom("")
    setCreatedTo("")
    setSortOption("newest")
    setPage(0)
  }

  const formatCurrency = (value?: number | null) => {
    if (typeof value !== "number") return "N/A"
    return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(value)
  }

  const getTrackingSummary = (order: ClientOrder) => {
    const ids = order.orderItems.map((item) => item.trackingId).filter(Boolean) as string[]
    if (ids.length === 0) return "No tracking"
    if (ids.length === 1) return ids[0]
    return `${ids[0]} +${ids.length - 1}`
  }

  const getRouteSummary = (order: ClientOrder) => {
    const firstItem = order.orderItems[0]
    const pickupCity = firstItem?.pickup?.address?.city
    const dropoffCity = firstItem?.dropoff?.address?.city

    if (!pickupCity || !dropoffCity) return "Route unavailable"
    return `${pickupCity} → ${dropoffCity}`
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-background px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Shipments</h1>
          <p className="text-xs text-muted-foreground">Track order status, payments, and delivery progress.</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className="h-6 px-2">{totalElements} orders</Badge>
          <Badge variant="outline" className="h-6 px-2">Page {page + 1}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm">Filters</CardTitle>
          <CardDescription className="text-xs">Filter by status and created date range.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 pb-3 px-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Order Status</Label>
              <Select value={orderStatus} onValueChange={(value) => { setOrderStatus(value); setPage(0) }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  {ORDER_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Created From</Label>
              <Input className="h-8 text-xs" type="date" value={createdFrom} onChange={(e) => { setCreatedFrom(e.target.value); setPage(0) }} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Created To</Label>
              <Input className="h-8 text-xs" type="date" value={createdTo} onChange={(e) => { setCreatedTo(e.target.value); setPage(0) }} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleResetFilters}>Reset</Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={fetchOrders}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Orders ({totalElements})</p>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Sort</Label>
              <Select value={sortOption} onValueChange={(value: SortOption) => { setSortOption(value); setPage(0) }}>
                <SelectTrigger className="h-8 text-xs w-[160px]"><SelectValue placeholder="Sort" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="updated">Recently updated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {isLoading ? (
            <ShipmentSkeleton />
          ) : orders.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Package className="h-7 w-7 text-muted-foreground mx-auto" />
              <p className="font-medium">No shipments found</p>
              <p className="text-xs text-muted-foreground">Try different filter values.</p>
            </div>
          ) : (
            <div className="divide-y rounded-md border">
              {orders.map((order) => (
                <div key={order.shippingOrderId} className="px-3 py-2.5 space-y-2 hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <p className="text-sm font-semibold truncate">{order.shippingOrderId || "N/A"}</p>
                      {getStatusPill(order.orderStatus)}
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency(order.aggregatedPricing?.totalAmount)}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Route className="h-3.5 w-3.5" /> {getRouteSummary(order)}</span>
                    <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> {order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}</span>
                    <span className="inline-flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> {getTrackingSummary(order)}</span>
                    <span className="inline-flex items-center gap-1"><Package className="h-3.5 w-3.5" /> {order.orderItems.length} item{order.orderItems.length === 1 ? "" : "s"}</span>
                    <span className="inline-flex items-center gap-1"><MapPinned className="h-3.5 w-3.5" /> Priority: {order.priorityDelivery ? "Yes" : "No"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Showing page <span className="font-medium text-foreground">{page + 1}</span> of <span className="font-medium text-foreground">{Math.max(totalPages, 1)}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs" disabled={page <= 0 || isLoading} onClick={() => setPage((prev) => prev - 1)}>
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                disabled={isLoading || totalPages === 0 || page + 1 >= totalPages}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
