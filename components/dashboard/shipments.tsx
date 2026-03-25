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
import { AlertCircle, Loader2, Package, RefreshCw, Search } from "lucide-react"

type PriorityFilter = "all" | "true" | "false"

interface ShipmentsProps {
  initialTrackingId?: string
}

const DEFAULT_PAGE_SIZE = 10

export function Shipments({ initialTrackingId }: ShipmentsProps) {
  const [orders, setOrders] = useState<ClientOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const [shippingOrderId, setShippingOrderId] = useState("")
  const [trackingId, setTrackingId] = useState(initialTrackingId || "")
  const [orderStatus, setOrderStatus] = useState("all")
  const [paymentStatus, setPaymentStatus] = useState("all")
  const [priorityDelivery, setPriorityDelivery] = useState<PriorityFilter>("all")
  const [createdFrom, setCreatedFrom] = useState("")
  const [createdTo, setCreatedTo] = useState("")

  const filters = useMemo<ClientOrdersFilters>(() => {
    return {
      shippingOrderId: shippingOrderId || undefined,
      trackingId: trackingId || undefined,
      orderStatus: orderStatus !== "all" ? orderStatus : undefined,
      paymentStatus: paymentStatus !== "all" ? paymentStatus : undefined,
      priorityDelivery: priorityDelivery === "all" ? undefined : priorityDelivery === "true",
      createdFrom: createdFrom || undefined,
      createdTo: createdTo || undefined,
      page,
      size: DEFAULT_PAGE_SIZE,
      sortBy: "createdAt",
      sortDir: "desc",
    }
  }, [shippingOrderId, trackingId, orderStatus, paymentStatus, priorityDelivery, createdFrom, createdTo, page])

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
      setError("Failed to load shipments. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [filters])

  const handleApplyFilters = () => {
    setPage(0)
  }

  const handleResetFilters = () => {
    setShippingOrderId("")
    setTrackingId("")
    setOrderStatus("all")
    setPaymentStatus("all")
    setPriorityDelivery("all")
    setCreatedFrom("")
    setCreatedTo("")
    setPage(0)
  }

  const formatStatus = (value?: string | null) => {
    if (!value) return "N/A"
    return value
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  }

  const formatCurrency = (value?: number | null) => {
    if (typeof value !== "number") return "N/A"
    return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(value)
  }

  const getTrackingSummary = (order: ClientOrder) => {
    const ids = order.orderItems.map((item) => item.trackingId).filter(Boolean) as string[]
    if (ids.length === 0) return "N/A"
    if (ids.length === 1) return ids[0]
    return `${ids[0]} (+${ids.length - 1} more)`
  }

  const getRouteSummary = (order: ClientOrder) => {
    const firstItem = order.orderItems[0]
    const pickupCity = firstItem?.pickup?.address?.city
    const dropoffCity = firstItem?.dropoff?.address?.city

    if (!pickupCity || !dropoffCity) return "N/A"
    return `${pickupCity} → ${dropoffCity}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Shipments</h1>
        <p className="text-muted-foreground mt-1">Track orders and review your latest shipment activity.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search shipments by order ID, tracking, status, priority, and date range.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="shippingOrderId">Shipping Order ID</Label>
              <Input
                id="shippingOrderId"
                value={shippingOrderId}
                onChange={(e) => setShippingOrderId(e.target.value)}
                placeholder="e.g. SO-12345"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trackingId">Tracking ID</Label>
              <Input
                id="trackingId"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="e.g. TRK-9988"
              />
            </div>

            <div className="space-y-2">
              <Label>Order Status</Label>
              <Select value={orderStatus} onValueChange={setOrderStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
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
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
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
              <Label>Priority Delivery</Label>
              <Select value={priorityDelivery} onValueChange={(value: PriorityFilter) => setPriorityDelivery(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="createdFrom">Created From</Label>
              <Input id="createdFrom" type="date" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="createdTo">Created To</Label>
              <Input id="createdTo" type="date" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleApplyFilters}>
              <Search className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
            <Button variant="outline" onClick={handleResetFilters}>
              Reset
            </Button>
            <Button variant="ghost" onClick={fetchOrders}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            {totalElements > 0 ? `${totalElements} total shipments` : "No shipments yet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-14 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading shipments...
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <Package className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">No shipments found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters to see more results.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.shippingOrderId} className="rounded-lg border p-4">
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Shipping Order ID</p>
                      <p className="font-semibold">{order.shippingOrderId || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Created At</p>
                      <p>{order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Order Status</p>
                      <Badge variant="outline">{formatStatus(order.orderStatus)}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Payment Status</p>
                      <Badge variant="outline">{formatStatus(order.paymentStatus)}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Priority Delivery</p>
                      <p>{order.priorityDelivery ? "Yes" : "No"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Amount</p>
                      <p className="font-medium">{formatCurrency(order.aggregatedPricing?.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tracking</p>
                      <p>{getTrackingSummary(order)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Route</p>
                      <p>{getRouteSummary(order)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page + 1} of {Math.max(totalPages, 1)}
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
