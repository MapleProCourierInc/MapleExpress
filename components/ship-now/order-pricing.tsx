"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft, CreditCard, DollarSign, Package, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { OrderResponse } from "@/lib/order-service"
import { createDraftOrder } from "@/lib/order-service"
import { useAuth } from "@/lib/auth-context"

interface OrderPricingProps {
    orderData: OrderResponse
    onBack: () => void
    onProceedToPayment: () => void
    isLoading: boolean
    onOrderUpdate: (updatedOrder: OrderResponse) => void
    originalOrder: any // The original shipping order data
}

export function OrderPricing({
                                 orderData,
                                 onBack,
                                 onProceedToPayment,
                                 isLoading,
                                 onOrderUpdate,
                                 originalOrder,
                             }: OrderPricingProps) {
    const { user } = useAuth()
    const [isPriorityDelivery, setIsPriorityDelivery] = useState(orderData.priorityDelivery)
    const [isUpdatingPriority, setIsUpdatingPriority] = useState(false)

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-CA", {
            style: "currency",
            currency: "CAD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount)
    }

    // Calculate total taxes - safely handle the case where taxes might be undefined
    const totalTaxes = orderData.aggregatedPricing.taxes
        ? orderData.aggregatedPricing.taxes.reduce((sum, tax) => sum + tax.amount, 0)
        : 0

    // Handle priority delivery toggle
    const handlePriorityToggle = async (checked: boolean) => {
        if (!user) return

        setIsUpdatingPriority(true)
        try {
            // Create a new draft order with the updated priority setting
            // Pass the existing order ID to update instead of creating a new one
            const updatedOrder = await createDraftOrder(
                originalOrder,
                user.userId,
                checked,
                orderData.shippingOrderId, // Pass the existing order ID
            )

            // Update the state
            setIsPriorityDelivery(checked)

            // Call the callback to update the parent component
            onOrderUpdate(updatedOrder)
        } catch (error) {
            console.error("Error updating priority delivery:", error)
            // Revert the toggle if there was an error
            setIsPriorityDelivery(!checked)
        } finally {
            setIsUpdatingPriority(false)
        }
    }

    return (
        <div className="space-y-8">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold">Order Summary</h1>
                <p className="text-muted-foreground mt-2">Review your shipping costs before proceeding to payment</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="overflow-hidden border-0 shadow-md">
                        <CardHeader className="bg-muted/30 pb-3">
                            <CardTitle className="text-lg flex items-center">
                                <Package className="mr-2 h-5 w-5 text-primary" />
                                Package Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {orderData.orderItems.map((item, index) => (
                                <div key={item.orderItemId} className="border-b last:border-b-0">
                                    <div className="p-4 bg-muted/10 flex justify-between items-center">
                                        <h3 className="font-medium flex items-center">
                      <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-full mr-2">
                        Package {index + 1}
                      </span>
                                        </h3>
                                        <span className="text-sm font-semibold text-primary">
                      {formatCurrency(item.pricing.totalAmount)}
                    </span>
                                    </div>

                                    <div className="p-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                            <div className="bg-muted/5 p-3 rounded-md">
                                                <p className="text-sm text-muted-foreground mb-1">From</p>
                                                <p className="font-medium">{item.pickup.address.fullName}</p>
                                                <p className="text-sm">
                                                    {item.pickup.address.city}, {item.pickup.address.province}
                                                </p>
                                            </div>
                                            <div className="bg-muted/5 p-3 rounded-md">
                                                <p className="text-sm text-muted-foreground mb-1">To</p>
                                                <p className="font-medium">{item.dropoff.address.fullName}</p>
                                                <p className="text-sm">
                                                    {item.dropoff.address.city}, {item.dropoff.address.province}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                                            <div className="bg-muted/5 p-3 rounded-md">
                                                <p className="text-xs text-muted-foreground mb-1">Weight</p>
                                                <p className="font-medium">{item.packageDetails.weight} kg</p>
                                            </div>
                                            <div className="bg-muted/5 p-3 rounded-md">
                                                <p className="text-xs text-muted-foreground mb-1">Dimensions</p>
                                                <p className="font-medium">
                                                    {item.packageDetails.dimensions.length} × {item.packageDetails.dimensions.width} ×{" "}
                                                    {item.packageDetails.dimensions.height} cm
                                                </p>
                                            </div>
                                            <div className="bg-muted/5 p-3 rounded-md">
                                                <p className="text-xs text-muted-foreground mb-1">Distance</p>
                                                <p className="font-medium">{(item.distanceToDelivery / 1000).toFixed(1)} km</p>
                                            </div>
                                            <div className="bg-muted/5 p-3 rounded-md">
                                                <p className="text-xs text-muted-foreground mb-1">Delivery Type</p>
                                                <p className="font-medium">{isPriorityDelivery ? "Priority" : "Standard"}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Base Price</p>
                                                <p className="font-medium">{formatCurrency(item.pricing.basePrice)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Distance Charge</p>
                                                <p className="font-medium">{formatCurrency(item.pricing.distanceCharge)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Weight Charge</p>
                                                <p className="font-medium">{formatCurrency(item.pricing.weightCharge)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Priority Surcharge</p>
                                                <p className="font-medium">{formatCurrency(item.pricing.prioritySurcharge)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-0 shadow-md">
                        <CardHeader className="bg-muted/30 pb-3">
                            <CardTitle className="text-lg flex items-center">
                                <DollarSign className="mr-2 h-5 w-5 text-primary" />
                                Order Total
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="space-y-4">
                                {/* Fixed layout with consistent alignment */}
                                <div className="grid grid-cols-[1fr,auto] items-center gap-2">
                                    <div className="flex items-center">
                                        <span className="text-sm">Base Price</span>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="w-[200px] text-xs">Base price for shipping services</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <span className="font-medium text-right">
                    {formatCurrency(orderData.aggregatedPricing.basePrice)}
                  </span>
                                </div>

                                <div className="grid grid-cols-[1fr,auto] items-center gap-2">
                                    <div className="flex items-center">
                                        <span className="text-sm">Distance Charge</span>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="w-[200px] text-xs">Charge based on the total distance for delivery</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <span className="font-medium text-right">
                    {formatCurrency(orderData.aggregatedPricing.distanceCharge)}
                  </span>
                                </div>

                                <div className="grid grid-cols-[1fr,auto] items-center gap-2">
                                    <div className="flex items-center">
                                        <span className="text-sm">Weight Charge</span>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="w-[200px] text-xs">Additional charge based on package weight</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <span className="font-medium text-right">
                    {formatCurrency(orderData.aggregatedPricing.weightCharge)}
                  </span>
                                </div>

                                <div className="grid grid-cols-[1fr,auto] items-center gap-2">
                                    <div className="flex items-center">
                                        <span className="text-sm">Priority Surcharge</span>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="w-[200px] text-xs">Additional charge for priority delivery</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <span className="font-medium text-right">
                    {formatCurrency(orderData.aggregatedPricing.prioritySurcharge)}
                  </span>
                                </div>

                                {orderData.aggregatedPricing.taxes &&
                                    orderData.aggregatedPricing.taxes.map((tax, index) => (
                                        <div key={index} className="grid grid-cols-[1fr,auto] items-center gap-2">
                                            <span className="text-sm">{tax.taxType}</span>
                                            <span className="font-medium text-right">{formatCurrency(tax.amount)}</span>
                                        </div>
                                    ))}

                                <Separator className="my-2" />

                                <div className="grid grid-cols-[1fr,auto] items-center gap-2">
                                    <span className="font-bold text-lg">Total</span>
                                    <span className="font-bold text-lg text-primary text-right">
                    {formatCurrency(orderData.aggregatedPricing.totalAmount)}
                  </span>
                                </div>

                                <div className="pt-4">
                                    <div className="flex items-center space-x-2 mb-6 bg-muted/10 p-3 rounded-md">
                                        <Switch
                                            id="priority-delivery"
                                            checked={isPriorityDelivery}
                                            onCheckedChange={handlePriorityToggle}
                                            disabled={isUpdatingPriority || isLoading}
                                        />
                                        <Label htmlFor="priority-delivery" className="font-medium text-sm">
                                            {isUpdatingPriority ? "Updating..." : "Priority Delivery"}
                                        </Label>
                                    </div>

                                    <Button
                                        onClick={onProceedToPayment}
                                        className="w-full bg-primary hover:bg-primary/90 flex items-center justify-center gap-2 py-6"
                                        disabled={isLoading || isUpdatingPriority}
                                    >
                                        {isLoading || isUpdatingPriority ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <CreditCard className="h-4 w-4" />
                                                Proceed to Payment
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={onBack}
                                        className="w-full mt-3 flex items-center justify-center gap-2"
                                        disabled={isLoading || isUpdatingPriority}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Back to Review
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="text-sm text-muted-foreground bg-muted/10 p-4 rounded-md">
                        <p>
                            By proceeding to payment, you agree to our{" "}
                            <a href="/terms" className="text-primary hover:underline">
                                Terms of Service
                            </a>{" "}
                            and{" "}
                            <a href="/privacy" className="text-primary hover:underline">
                                Privacy Policy
                            </a>
                            .
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

