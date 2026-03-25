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
import { AlertCircle, ArrowRight, CalendarClock, CircleDollarSign, Package, RefreshCw, Route, Truck } from "lucide-react"

type SortOption = "newest" | "oldest" | "updated"

const DEFAULT_PAGE_SIZE = 10

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

function getStatusPill(status?: string | null, type: "order" | "payment" = "order") {
  const normalized = (status || "").toLowerCase()

  const successSet = new Set(["delivered", "paid", "completed", "success"])
  const warningSet = new Set(["pending", "payment_pending", "awaiting_payment"])
  const transitSet = new Set(["confirmed", "picked_up", "in_transit", "processing"])
  const dangerSet = new Set(["cancelled", "failed", "returned", "refunded"])

  let classes = "bg-muted text-muted-foreground border-border"

  if (successSet.has(normalized)) {
    classes = "bg-emerald-100 text-emerald-800 border-emerald-200"
  } else if (dangerSet.has(normalized)) {
    classes = "bg-rose-100 text-rose-800 border-rose-200"
  } else if (warningSet.has(normalized)) {
    classes = type === "payment" ? "bg-amber-100 text-amber-900 border-amber-200" : "bg-yellow-100 text-yellow-900 border-yellow-200"
  } else if (transitSet.has(normalized)) {
    classes = "bg-sky-100 text-sky-900 border-sky-200"
  }

  const label = status
    ? status
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "Unknown"

  return (
    <Badge variant="outline" className={`rounded-full px-3 py-1 text-xs font-medium border ${classes}`}>
      {label}
    </Badge>
  )
}

function ShipmentSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, idx) => (
        <Card key={idx} className="border-border/70">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          </CardContent>
        </Card>
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
  const [paymentStatus, setPaymentStatus] = useState("all")
  const [createdFrom, setCreatedFrom] = useState("")
  const [createdTo, setCreatedTo] = useState("")
  const [sortOption, setSortOption] = useState<SortOption>("newest")

  const sortParams = useMemo(() => getSortParams(sortOption), [sortOption])

  const filters = useMemo<ClientOrdersFilters>(() => {
    return {
      orderStatus: orderStatus !== "all" ? orderStatus : undefined,
      paymentStatus: paymentStatus !== "all" ? paymentStatus : undefined,
      createdFrom: createdFrom || undefined,
      createdTo: createdTo || undefined,
      page,
      size: DEFAULT_PAGE_SIZE,
      sortBy: sortParams.sortBy,
      sortDir: sortParams.sortDir,
    }
  }, [orderStatus, paymentStatus, createdFrom, createdTo, page, sortParams])

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
    setPaymentStatus("all")
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
    if (ids.length === 0) return "No tracking available"
    if (ids.length === 1) return ids[0]
    return `${ids[0]} +${ids.length - 1} more`
  }

  const getRouteSummary = (order: ClientOrder) => {
    const firstItem = order.orderItems[0]
    const pickupCity = firstItem?.pickup?.address?.city
    const dropoffCity = firstItem?.dropoff?.address?.city

    if (!pickupCity || !dropoffCity) return "Route details unavailable"
    return `${pickupCity} → ${dropoffCity}`
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm bg-gradient-to-r from-primary/5 via-background to-secondary/5">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Client Portal</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mt-1">Shipments</h1>
              <p className="text-muted-foreground mt-2">Manage and monitor your shipment orders in one place.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 min-w-[240px]">
              <div className="rounded-xl border bg-background/80 p-3">
                <p className="text-xs text-muted-foreground">Total Orders</p>
                <p className="text-xl font-semibold">{totalElements}</p>
              </div>
              <div className="rounded-xl border bg-background/80 p-3">
                <p className="text-xs text-muted-foreground">Current Page</p>
                <p className="text-xl font-semibold">{page + 1}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle>Filter & Sort</CardTitle>
          <CardDescription>Use practical filters and sorting to quickly find relevant orders.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Order Status</Label>
              <Select
                value={orderStatus}
                onValueChange={(value) => {
                  setOrderStatus(value)
                  setPage(0)
                }}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All order statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="PICKED_UP">Picked Up</SelectItem>
                  <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select
                value={paymentStatus}
                onValueChange={(value) => {
                  setPaymentStatus(value)
                  setPage(0)
                }}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All payment statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select
                value={sortOption}
                onValueChange={(value: SortOption) => {
                  setSortOption(value)
                  setPage(0)
                }}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="updated">Recently updated</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Amount sorting is hidden until backend exposes a dedicated sortable amount field.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="createdFrom">Created From</Label>
              <Input
                id="createdFrom"
                type="date"
                value={createdFrom}
                onChange={(e) => {
                  setCreatedFrom(e.target.value)
                  setPage(0)
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="createdTo">Created To</Label>
              <Input
                id="createdTo"
                type="date"
                value={createdTo}
                onChange={(e) => {
                  setCreatedTo(e.target.value)
                  setPage(0)
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" onClick={handleResetFilters}>Reset filters</Button>
            <Button variant="ghost" onClick={fetchOrders}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <ShipmentSkeleton />
      ) : orders.length === 0 ? (
        <Card className="border-dashed border-border/80">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <Package className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">No shipments found</h3>
            <p className="text-muted-foreground mt-2 max-w-md">
              No orders matched your current filters. Adjust filters and try again.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.shippingOrderId} className="shadow-sm hover:shadow-md transition-shadow border-border/70">
              <CardContent className="p-5 md:p-6 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Shipping Order</p>
                    <h3 className="text-lg md:text-xl font-semibold">{order.shippingOrderId || "N/A"}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusPill(order.orderStatus, "order")}
                      {getStatusPill(order.paymentStatus, "payment")}
                    </div>
                  </div>

                  <div className="text-left lg:text-right rounded-xl border bg-muted/30 px-4 py-3 min-w-[180px]">
                    <p className="text-xs text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-semibold text-foreground">{formatCurrency(order.aggregatedPricing?.totalAmount)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  <div className="rounded-xl border bg-background p-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Route className="h-3.5 w-3.5" /> Route
                    </p>
                    <p className="font-medium mt-1">{getRouteSummary(order)}</p>
                  </div>

                  <div className="rounded-xl border bg-background p-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" /> Created At
                    </p>
                    <p className="font-medium mt-1">{order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}</p>
                  </div>

                  <div className="rounded-xl border bg-background p-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5" /> Tracking
                    </p>
                    <p className="font-medium mt-1 break-words">{getTrackingSummary(order)}</p>
                  </div>

                  <div className="rounded-xl border bg-background p-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CircleDollarSign className="h-3.5 w-3.5" /> Items
                    </p>
                    <p className="font-medium mt-1">
                      {order.orderItems.length} package{order.orderItems.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <div className="pt-1 text-sm text-muted-foreground flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Priority delivery: <span className="font-medium text-foreground">{order.priorityDelivery ? "Yes" : "No"}</span>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="shadow-sm">
            <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Showing page <span className="font-medium text-foreground">{page + 1}</span> of{" "}
                <span className="font-medium text-foreground">{Math.max(totalPages, 1)}</span>
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" disabled={page <= 0 || isLoading} onClick={() => setPage((prev) => prev - 1)}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={isLoading || totalPages === 0 || page + 1 >= totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
