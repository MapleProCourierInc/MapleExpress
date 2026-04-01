"use client"

import { useEffect, useMemo, useState } from "react"
import { getClientOrders, type ClientOrder, type ClientOrdersFilters } from "@/lib/order-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarClock, Package, Route, Truck, AlertCircle } from "lucide-react"

type SortOption = "newest" | "oldest" | "updated"
type StatusTab = "delivered" | "in_progress" | "failed"

const PAGE_SIZE = 10

const TAB_STATUS_MAP: Record<StatusTab, string[]> = {
  delivered: ["delivered", "partial_complete"],
  in_progress: ["confirmed", "label_created", "scheduled", "assigned", "picked_up", "in_transit", "in_progress", "end_of_day", "drop_off_failed"],
  failed: ["draft", "payment_pending", "payment_failed", "pickup_failed", "returned", "failed", "cancelled"],
}

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

function statusBadge(status?: string | null) {
  const value = (status || "").toLowerCase()
  const success = new Set(["confirmed", "delivered", "partial_complete"])
  const progress = new Set(["label_created", "scheduled", "assigned", "picked_up", "in_transit", "in_progress"])
  const warning = new Set(["payment_pending", "end_of_day"])
  const danger = new Set(["payment_failed", "pickup_failed", "drop_off_failed", "failed", "cancelled"])
  const neutral = new Set(["draft", "returned"])

  let tone = "bg-slate-100 text-slate-700 border-slate-200"
  if (success.has(value)) tone = "bg-emerald-100 text-emerald-800 border-emerald-200"
  else if (progress.has(value)) tone = "bg-sky-100 text-sky-800 border-sky-200"
  else if (warning.has(value)) tone = "bg-amber-100 text-amber-900 border-amber-200"
  else if (danger.has(value)) tone = "bg-rose-100 text-rose-800 border-rose-200"
  else if (neutral.has(value)) tone = "bg-zinc-100 text-zinc-700 border-zinc-200"

  const label = status
    ? status
        .split("_")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ")
    : "Unknown"

  return (
    <Badge variant="outline" className={`h-6 rounded-md px-2 text-[11px] border ${tone}`}>
      {label}
    </Badge>
  )
}

function summarizeRoute(order: ClientOrder) {
  const item = order.orderItems?.[0]
  const pickup = item?.pickup?.address?.city
  const dropoff = item?.dropoff?.address?.city
  return pickup && dropoff ? `${pickup} → ${dropoff}` : "Route unavailable"
}

function summarizeTracking(order: ClientOrder) {
  const ids = order.orderItems?.map((i) => i.trackingId).filter(Boolean) as string[]
  if (!ids?.length) return "No tracking"
  if (ids.length === 1) return ids[0]
  return `${ids[0]} +${ids.length - 1}`
}

function money(value?: number | null) {
  if (typeof value !== "number") return "N/A"
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(value)
}

function itemBucket(status?: string | null): "delivered" | "in_progress" | "failed" {
  const v = (status || "").toLowerCase()
  if (["delivered", "partial_complete"].includes(v)) return "delivered"
  if (["draft", "payment_pending", "payment_failed", "pickup_failed", "returned", "failed", "cancelled"].includes(v)) return "failed"
  return "in_progress"
}

export function Shipments() {
  const [activeTab, setActiveTab] = useState<StatusTab>("delivered")
  const [sortOption, setSortOption] = useState<SortOption>("newest")
  const [page, setPage] = useState(0)

  const [ordersPage, setOrdersPage] = useState<ClientOrder[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const sortParams = useMemo(() => getSortParams(sortOption), [sortOption])

  const loadOrders = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await getClientOrders({
        page,
        size: PAGE_SIZE,
        sortBy: sortParams.sortBy,
        sortDir: sortParams.sortDir,
      })

      setOrdersPage(response.orders || [])
      setTotalElements(response.pagination?.totalElements || 0)
      setTotalPages(Math.max(1, response.pagination?.totalPages || 1))
    } catch (err) {
      console.error("Failed to fetch orders", err)
      setError("Failed to load shipments. Please try again.")
      setOrdersPage([])
      setTotalElements(0)
      setTotalPages(0)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [page, sortParams])

  const visibleOrders = useMemo(() => {
    const statuses = new Set(TAB_STATUS_MAP[activeTab])
    return ordersPage.filter((order) => statuses.has((order.orderStatus || "").toLowerCase()))
  }, [ordersPage, activeTab])

  useEffect(() => {
    if (!visibleOrders.length) {
      setSelectedOrderId(null)
      return
    }

    const exists = selectedOrderId && visibleOrders.some((o) => o.shippingOrderId === selectedOrderId)
    if (!exists) {
      setSelectedOrderId(visibleOrders[0].shippingOrderId)
    }
  }, [visibleOrders, selectedOrderId, activeTab, page])

  const selectedOrder = useMemo(
    () => visibleOrders.find((o) => o.shippingOrderId === selectedOrderId) || null,
    [visibleOrders, selectedOrderId],
  )

  const itemProgress = useMemo(() => {
    if (!selectedOrder?.orderItems?.length) return { delivered: 0, in_progress: 0, failed: 0 }

    return selectedOrder.orderItems.reduce(
      (acc, item: any) => {
        const bucket = itemBucket(item.itemStatus)
        acc[bucket] += 1
        return acc
      },
      { delivered: 0, in_progress: 0, failed: 0 },
    )
  }, [selectedOrder])

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-background px-3 py-2">
        <h1 className="text-xl font-semibold tracking-tight">Shipments Workspace</h1>
        <p className="text-xs text-muted-foreground">Browse orders on the left and inspect full order items on the right.</p>
      </div>

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 min-h-[620px]">
        <Card className="lg:col-span-2 flex flex-col min-h-[620px]">
          <CardHeader className="px-3 py-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm">Shipping Orders</CardTitle>
              <Select
                value={sortOption}
                onValueChange={(value: SortOption) => {
                  setSortOption(value)
                  setPage(0)
                }}
              >
                <SelectTrigger className="h-8 text-xs w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="updated">Recently updated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as StatusTab)}>
              <TabsList className="grid grid-cols-3 h-8">
                <TabsTrigger value="delivered" className="text-xs">Delivered</TabsTrigger>
                <TabsTrigger value="in_progress" className="text-xs">In Progress</TabsTrigger>
                <TabsTrigger value="failed" className="text-xs">Failed</TabsTrigger>
              </TabsList>
            </Tabs>
            <CardDescription className="text-xs">{totalElements} orders</CardDescription>
          </CardHeader>

          <CardContent className="px-0 pb-2 flex-1 flex flex-col min-h-0">
            {isLoading ? (
              <div className="space-y-2 px-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="border rounded-md p-2.5 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : visibleOrders.length === 0 ? (
              <div className="flex-1 px-4 py-10 text-center text-xs text-muted-foreground flex items-center justify-center">
                No orders in this tab for the current fetched page.
              </div>
            ) : (
              <div className="divide-y border-y flex-1">
                {visibleOrders.map((order) => {
                  const selected = selectedOrderId === order.shippingOrderId
                  return (
                    <button
                      key={order.shippingOrderId}
                      className={`w-full text-left px-3 py-2.5 hover:bg-muted/30 ${selected ? "bg-muted/60" : ""}`}
                      onClick={() => setSelectedOrderId(order.shippingOrderId)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold truncate">{order.shippingOrderId}</p>
                        <p className="text-xs font-semibold">{money(order.aggregatedPricing?.totalAmount)}</p>
                      </div>
                      <div className="mt-1 flex items-center gap-2">{statusBadge(order.orderStatus)}</div>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Route className="h-3 w-3" /> {summarizeRoute(order)}</span>
                        <span className="inline-flex items-center gap-1"><CalendarClock className="h-3 w-3" /> {new Date(order.createdAt).toLocaleDateString()}</span>
                        <span className="inline-flex items-center gap-1"><Package className="h-3 w-3" /> {order.orderItems?.length || 0} items</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            <div className="flex items-center justify-between px-3 pt-2 mt-auto border-t">
              <p className="text-[11px] text-muted-foreground">Page {page + 1} / {Math.max(totalPages, 1)}</p>
              <div className="flex gap-1">
                <button
                  className="text-xs border rounded px-2 py-1 disabled:opacity-50"
                  disabled={page <= 0 || isLoading}
                  onClick={() => setPage((prev) => prev - 1)}
                >
                  Prev
                </button>
                <button
                  className="text-xs border rounded px-2 py-1 disabled:opacity-50"
                  disabled={isLoading || page + 1 >= totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardContent className="p-3 space-y-3">
            {!selectedOrder ? (
              <div className="h-full min-h-[460px] flex items-center justify-center text-sm text-muted-foreground">
                Select a shipping order to view details.
              </div>
            ) : (
              <>
                <div className="border rounded-md p-3 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-semibold">{selectedOrder.shippingOrderId}</h2>
                      {statusBadge(selectedOrder.orderStatus)}
                    </div>
                    <p className="text-lg font-semibold">{money(selectedOrder.aggregatedPricing?.totalAmount)}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>Created: {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : "N/A"}</div>
                    <div>Payment: {(selectedOrder as any).paymentStatus || "N/A"}</div>
                    <div>Updated: {(selectedOrder as any).updatedAt ? new Date((selectedOrder as any).updatedAt).toLocaleString() : "N/A"}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline" className="h-6">Delivered: {itemProgress.delivered}</Badge>
                    <Badge variant="outline" className="h-6">In Progress: {itemProgress.in_progress}</Badge>
                    <Badge variant="outline" className="h-6">Failed: {itemProgress.failed}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Order Items</h3>
                  {selectedOrder.orderItems?.length ? (
                    <div className="divide-y border rounded-md">
                      {selectedOrder.orderItems.map((item: any, idx: number) => (
                        <div key={item.trackingId || idx} className="p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium">Item {idx + 1}</p>
                              {statusBadge(item.itemStatus)}
                            </div>
                            <p className="text-xs text-muted-foreground">Tracking: {item.trackingId || "N/A"}</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>
                              <p className="font-medium text-foreground">Pickup</p>
                              <p>{item.pickup?.address?.city || "N/A"} • {item.pickup?.address?.streetAddress || "Address unavailable"}</p>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Dropoff</p>
                              <p>{item.dropoff?.address?.city || "N/A"} • {item.dropoff?.address?.streetAddress || "Address unavailable"}</p>
                            </div>
                            <div>Package: {item.packageDetails?.type || "N/A"} • {item.packageDetails?.weight ?? "N/A"} kg</div>
                            <div>ETA: {item.estimatedDeliveryTime ? new Date(item.estimatedDeliveryTime).toLocaleString() : "N/A"}</div>
                            <div>Fragile: {item.isFragile ? "Yes" : "No"}</div>
                            <div>Incidents: {item.specialIncidents?.length || 0}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground border rounded-md p-3">No order items available.</div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
