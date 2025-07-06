"use client"

import { useEffect, useState } from "react"
import type { OrderResponse } from "@/lib/order-service"
import { getPaidOrdersByCustomer } from "@/lib/order-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"

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
        setOrders(data)
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading orders...</span>
      </div>
    )
  }


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Shipments</h1>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {orders.length === 0 ? (
        <p className="text-muted-foreground">No orders found.</p>
      ) : (
        orders.map((order) => (
          <Card key={order.shippingOrderId} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Order {order.shippingOrderId}</CardTitle>
                  <CardDescription>
                    Status: {order.orderStatus} | Payment: {order.paymentStatus}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleExpand(order.shippingOrderId)}>
                <span>Total Amount: ${order.aggregatedPricing.totalAmount.toFixed(2)}</span>
                {expanded[order.shippingOrderId] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
              {expanded[order.shippingOrderId] && (
                <div className="mt-4 space-y-3">
                  {order.orderItems.map((item) => (
                    <div key={item.orderItemId} className="p-3 border rounded space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium">
                          {item.trackingNumber || `Package ${item.orderItemId}`}: {item.itemStatus}
                        </p>
                        {item.trackingNumber && (
                          <Button asChild size="sm" variant="outline">
                            <a
                              href={`https://www.maplexpress.ca/track?trackingNumber=${item.trackingNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Track
                            </a>
                          </Button>
                        )}
                      </div>
                      <p className="text-sm">
                        Pickup: {`${item.pickup.address.fullName}, ${item.pickup.address.streetAddress}${item.pickup.address.addressLine2 ? ", " + item.pickup.address.addressLine2 : ""}, ${item.pickup.address.city}, ${item.pickup.address.province} ${item.pickup.address.postalCode}`}
                      </p>
                      <p className="text-sm">
                        Dropoff: {`${item.dropoff.address.fullName}, ${item.dropoff.address.streetAddress}${item.dropoff.address.addressLine2 ? ", " + item.dropoff.address.addressLine2 : ""}, ${item.dropoff.address.city}, ${item.dropoff.address.province} ${item.dropoff.address.postalCode}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

