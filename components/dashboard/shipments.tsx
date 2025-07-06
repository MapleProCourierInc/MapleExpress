"use client"

import { useEffect, useState } from "react"
import type { OrderResponse } from "@/lib/order-service"
import { getPaidOrdersByCustomer } from "@/lib/order-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Package,
  MapPin,
  ExternalLink,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react"

interface ShipmentsProps {
  userId: string
}

export function Shipments({ userId }: ShipmentsProps) {
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getPaidOrdersByCustomer(userId)
        // Sort orders by createdAt date in descending order (newest first)
        const sortedData = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setOrders(sortedData)
      } catch (err: any) {
        console.error("Error fetching orders", err)
        setError("Failed to load orders. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [userId])

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "default"
      case "confirmed":
      case "picked_up":
      case "in_transit":
        return "secondary"
      case "draft":
      case "payment_pending":
      case "pending":
        return "outline"
      case "cancelled":
      case "returned":
      case "failed":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return <CheckCircle className="h-3 w-3" />
      case "confirmed":
        return <Package className="h-3 w-3" />
      case "picked_up":
        return <Truck className="h-3 w-3" />
      case "in_transit":
        return <Truck className="h-3 w-3" />
      case "draft":
      case "payment_pending":
      case "pending":
        return <Clock className="h-3 w-3" />
      case "cancelled":
      case "failed":
        return <XCircle className="h-3 w-3" />
      case "returned":
        return <AlertCircle className="h-3 w-3" />
      default:
        return <Package className="h-3 w-3" />
    }
  }

  const formatStatusDisplay = (status: string) => {
    switch (status.toLowerCase()) {
      case "payment_pending":
        return "Payment Pending"
      case "picked_up":
        return "Picked Up"
      case "in_transit":
        return "In Transit"
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    }
  }

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-muted"></div>
            <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">Loading your shipments</p>
            <p className="text-sm text-muted-foreground">Please wait while we fetch your order details...</p>
          </div>
        </div>
    )
  }

  return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">My Shipments</h1>
          <p className="text-muted-foreground">Track and manage all your orders in one place</p>
        </div>

        {error && (
            <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
        )}

        {orders.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">No shipments found</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    You don't have any orders yet. When you place an order, it will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
        ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                  <Card key={order.shippingOrderId} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-xl">{order.shippingOrderId}</CardTitle>
                            <Badge variant={getStatusBadgeVariant(order.orderStatus)} className="flex items-center gap-1">
                              {getStatusIcon(order.orderStatus)}
                              {formatStatusDisplay(order.orderStatus)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <span>Payment:</span>
                              <Badge variant={getStatusBadgeVariant(order.paymentStatus)} size="sm">
                                {order.paymentStatus}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              <span>
                          {order.orderItems.length} item{order.orderItems.length !== 1 ? "s" : ""}
                        </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                          Placed{" "}
                                {new Date(order.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                        </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">${order.aggregatedPricing.totalAmount.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">Total Amount</div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <Button
                          variant="ghost"
                          className="w-full justify-between p-4 h-auto hover:bg-muted/50"
                          onClick={() => toggleExpand(order.shippingOrderId)}
                      >
                        <span className="font-medium">View shipment details</span>
                        {expanded[order.shippingOrderId] ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>

                      {expanded[order.shippingOrderId] && (
                          <div className="mt-4 space-y-4">
                            <Separator />
                            <div className="space-y-4">
                              {order.orderItems.map((item, index) => (
                                  <div key={item.orderItemId} className="border rounded-lg p-4 space-y-4 bg-muted/20">
                                    <div className="flex items-start justify-between">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-semibold">Package {index + 1}</h4>
                                          <Badge
                                              variant={getStatusBadgeVariant(item.itemStatus)}
                                              size="sm"
                                              className="flex items-center gap-1"
                                          >
                                            {getStatusIcon(item.itemStatus)}
                                            {formatStatusDisplay(item.itemStatus)}
                                          </Badge>
                                        </div>
                                        {item.trackingNumber && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                              <span>Tracking:</span>
                                              <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                                                {item.trackingNumber}
                                              </code>
                                            </div>
                                        )}

                                        {/* Add package details section */}
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                          <div className="flex items-center gap-1">
                                            <Package className="h-3 w-3" />
                                            <span>Weight: {item.packageDetails.weight} kg</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                  <span>
                                    Dimensions: {item.packageDetails.dimensions.length}" ×{" "}
                                    {item.packageDetails.dimensions.width}" × {item.packageDetails.dimensions.height}"
                                  </span>
                                          </div>
                                        </div>
                                      </div>
                                      {item.trackingNumber && (
                                          <Button asChild size="sm" variant="outline" className="shrink-0 bg-transparent">
                                            <a
                                                href={`https://www.maplexpress.ca/track?trackingNumber=${item.trackingNumber}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1"
                                            >
                                              <ExternalLink className="h-3 w-3" />
                                              Track Package
                                            </a>
                                          </Button>
                                      )}
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                          <MapPin className="h-4 w-4" />
                                          Pickup Location
                                        </div>
                                        <div className="bg-background border rounded p-3 text-sm">
                                          <div className="font-medium">{item.pickup.address.fullName}</div>
                                          <div className="text-muted-foreground">
                                            {item.pickup.address.streetAddress}
                                            {item.pickup.address.addressLine2 && `, ${item.pickup.address.addressLine2}`}
                                          </div>
                                          <div className="text-muted-foreground">
                                            {item.pickup.address.city}, {item.pickup.address.province}{" "}
                                            {item.pickup.address.postalCode}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                          <MapPin className="h-4 w-4" />
                                          Delivery Location
                                        </div>
                                        <div className="bg-background border rounded p-3 text-sm">
                                          <div className="font-medium">{item.dropoff.address.fullName}</div>
                                          <div className="text-muted-foreground">
                                            {item.dropoff.address.streetAddress}
                                            {item.dropoff.address.addressLine2 && `, ${item.dropoff.address.addressLine2}`}
                                          </div>
                                          <div className="text-muted-foreground">
                                            {item.dropoff.address.city}, {item.dropoff.address.province}{" "}
                                            {item.dropoff.address.postalCode}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                              ))}
                            </div>
                          </div>
                      )}
                    </CardContent>
                  </Card>
              ))}
            </div>
        )}
      </div>
  )
}
