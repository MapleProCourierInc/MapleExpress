"use client"

import { useEffect, useState } from "react"
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, CreditCard, DollarSign, FileQuestion, Info, Loader2, Package, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { requestAdminQuote, updateRushPriority, type ChargeMap, type OrderResponse } from "@/lib/order-service"

interface OrderPricingProps {
  orderData: OrderResponse
  onBack: () => void
  onCancelOrder: () => Promise<void> | void
  onProceedToPayment: () => void
  onRemovePackage: (packageIndex: number) => Promise<void>
  isLoading: boolean
  onOrderUpdate: (updatedOrder: OrderResponse) => void
}

function formatChargeName(name: string) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function chargeEntries(charges?: ChargeMap) {
  return Object.entries(charges ?? {}).filter(([, amount]) => Number.isFinite(amount))
}

function rootQuoteReasons(orderData: OrderResponse) {
  return (
    orderData.aggregatedPricing.customQuoteReasons ??
    orderData.aggregatedPricing.customerQuoteReasons ??
    orderData.aggregatedPricing.customerQuoteResons ??
    []
  )
}

export function OrderPricing({
  orderData,
  onBack,
  onCancelOrder,
  onProceedToPayment,
  onRemovePackage,
  isLoading,
  onOrderUpdate,
}: OrderPricingProps) {
  const router = useRouter()
  const [isPriorityDelivery, setIsPriorityDelivery] = useState(orderData.priorityDelivery)
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false)
  const [removingPackageIndex, setRemovingPackageIndex] = useState<number | null>(null)
  const [isRequestingQuote, setIsRequestingQuote] = useState(false)
  const [quoteRequested, setQuoteRequested] = useState(false)
  const [isQuoteConfirmationOpen, setIsQuoteConfirmationOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [expandedPackages, setExpandedPackages] = useState<Record<string, boolean>>({})

  const currency = orderData.aggregatedPricing.currency || "CAD"
  const quoteRequired = orderData.aggregatedPricing.customQuoteRequired
  const isBusy = isLoading || isUpdatingPriority || removingPackageIndex !== null || isRequestingQuote

  useEffect(() => {
    setIsPriorityDelivery(orderData.priorityDelivery)
  }, [orderData.priorityDelivery])

  const formatCurrency = (amount: number, amountCurrency = currency) => {
    if (!Number.isFinite(amount)) return "Unavailable"

    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: amountCurrency || "CAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const handlePriorityToggle = async (checked: boolean) => {
    setIsUpdatingPriority(true)
    setActionError(null)
    try {
      const updatedOrder = await updateRushPriority(orderData.shippingOrderId, checked)

      setIsPriorityDelivery(updatedOrder.priorityDelivery)
      setQuoteRequested(false)
      onOrderUpdate(updatedOrder)
    } catch (error) {
      console.error("Error updating priority delivery:", error)
      setActionError(error instanceof Error ? error.message : "Failed to update priority delivery.")
    } finally {
      setIsUpdatingPriority(false)
    }
  }

  const handleRemovePackage = async (packageIndex: number) => {
    setRemovingPackageIndex(packageIndex)
    setActionError(null)
    try {
      await onRemovePackage(packageIndex)
      setQuoteRequested(false)
    } catch (error) {
      console.error("Error removing package:", error)
      setActionError(error instanceof Error ? error.message : "Failed to remove package.")
    } finally {
      setRemovingPackageIndex(null)
    }
  }

  const handleRequestQuote = async () => {
    setIsRequestingQuote(true)
    setActionError(null)
    try {
      const updatedOrder = await requestAdminQuote(orderData.shippingOrderId)
      if (updatedOrder) {
        onOrderUpdate(updatedOrder)
      }
      setQuoteRequested(true)
      setIsQuoteConfirmationOpen(true)
    } catch (error) {
      console.error("Error requesting admin quote:", error)
      setActionError(error instanceof Error ? error.message : "Failed to send your quote request.")
    } finally {
      setIsRequestingQuote(false)
    }
  }

  return (
    <div className="space-y-8">
      <Dialog open={isQuoteConfirmationOpen} onOpenChange={setIsQuoteConfirmationOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="items-center text-center sm:text-center">
            <div className="mb-2 rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <DialogTitle className="text-2xl">Quote request sent</DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-6">
              Your order has been sent to our team for a custom quote. You can follow its progress in the Quotes
              section of your dashboard, where you will be able to review and accept or decline the quote once it is
              ready.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2 sm:justify-center">
            <Button type="button" onClick={() => router.push("/dashboard?section=quotes")} className="w-full">
              View Quotes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Order Summary</h1>
        <p className="text-muted-foreground mt-2">Review your shipping costs before proceeding to payment</p>
      </div>

      {actionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to update order</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="ship-now-summary-card overflow-hidden">
            <CardHeader className="ship-now-summary-card-header pb-3">
              <CardTitle className="text-lg flex items-center">
                <Package className="mr-2 h-5 w-5 text-primary" />
                Package Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {orderData.orderItems.map((item, index) => {
                const itemCurrency = item.pricing.currency || currency
                const itemCharges = chargeEntries(item.pricing.charges)
                const itemKey = item.trackingId || item.orderItemId || `order-item-${index}`
                const isExpanded = expandedPackages[itemKey] ?? false

                return (
                  <Collapsible
                    key={itemKey}
                    open={isExpanded}
                    onOpenChange={(open) => setExpandedPackages((current) => ({ ...current, [itemKey]: open }))}
                    className="border-b last:border-b-0"
                  >
                    <div className="p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-full">
                              Package {index + 1}
                            </span>
                            {item.pricing.customQuoteRequired ? (
                              <Badge variant="destructive">Custom quote required</Badge>
                            ) : (
                              <Badge variant="secondary">Pricing available</Badge>
                            )}
                            {item.isFragile && (
                              <Badge variant="outline" className="border-amber-300 text-amber-700">
                                Fragile
                              </Badge>
                            )}
                            {item.signatureRequired && (
                              <Badge variant="outline" className="border-primary/40 text-primary">
                                Signature required
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                            <span>{item.pickup.address.city}, {item.pickup.address.province}</span>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{item.dropoff.address.city}, {item.dropoff.address.province}</span>
                          </div>

                          <p className="truncate text-sm text-muted-foreground">
                            {item.description || "No package description provided."}
                          </p>

                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>{item.packageDetails.weight} kg</span>
                            <span>
                              {item.packageDetails.dimensions.length} x {item.packageDetails.dimensions.width} x{" "}
                              {item.packageDetails.dimensions.height} cm
                            </span>
                            <span>{(item.distanceToDelivery / 1000).toFixed(1)} km</span>
                            <span>{isPriorityDelivery ? "Priority" : "Standard"}</span>
                            {!item.pricing.customQuoteRequired && <span>{itemCharges.length} charges</span>}
                          </div>
                        </div>

                        <CollapsibleTrigger asChild>
                          <Button type="button" variant="ghost" size="sm" className="self-start shrink-0">
                            {isExpanded ? "Hide details" : "View details"}
                            <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </Button>
                        </CollapsibleTrigger>
                      </div>

                      {item.pricing.customQuoteRequired ? (
                        <Alert className="mt-4 border-amber-300 bg-amber-50 text-amber-950">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Package needs a custom quote</AlertTitle>
                          <AlertDescription className="space-y-3">
                            <p>{item.pricing.customQuoteReason || "This package is outside the available pricing slabs."}</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemovePackage(index)}
                              disabled={isBusy || orderData.orderItems.length <= 1}
                            >
                              {removingPackageIndex === index ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                              )}
                              Remove package
                            </Button>
                          </AlertDescription>
                        </Alert>
                      ) : null}

                      <CollapsibleContent>
                        <div className="mt-4 space-y-4 border-t pt-4">
                          <div className="grid gap-4 text-sm sm:grid-cols-2">
                            <div>
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">From</p>
                              <p className="font-medium">{item.pickup.address.fullName}</p>
                              <p className="text-muted-foreground">
                                {item.pickup.address.city}, {item.pickup.address.province}
                              </p>
                            </div>
                            <div>
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">To</p>
                              <p className="font-medium">{item.dropoff.address.fullName}</p>
                              <p className="text-muted-foreground">
                                {item.dropoff.address.city}, {item.dropoff.address.province}
                              </p>
                            </div>
                          </div>

                          {!item.pricing.customQuoteRequired && (
                            <div>
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Charges</p>
                              <div className="grid gap-x-6 sm:grid-cols-2">
                                {itemCharges.map(([name, amount]) => (
                                  <div key={name} className="flex items-center justify-between gap-3 border-b py-2 text-sm last:border-b-0">
                                    <span>{formatChargeName(name)}</span>
                                    <span className="font-medium">{formatCurrency(amount, itemCurrency)}</span>
                                  </div>
                                ))}
                                {itemCharges.length === 0 && (
                                  <p className="text-sm text-muted-foreground">No package-level charges were returned.</p>
                                )}
                              </div>
                            </div>
                          )}

                          <div>
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Package flags</p>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant={item.isFragile ? "outline" : "secondary"} className={item.isFragile ? "border-amber-300 text-amber-700" : ""}>
                                {item.isFragile ? "Fragile item" : "Not fragile"}
                              </Badge>
                              <Badge variant={item.signatureRequired ? "outline" : "secondary"} className={item.signatureRequired ? "border-primary/40 text-primary" : ""}>
                                {item.signatureRequired ? "Signature required" : "No signature required"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="ship-now-summary-card">
            <CardHeader className="ship-now-summary-card-header pb-3">
              <CardTitle className="text-lg flex items-center">
                <DollarSign className="mr-2 h-5 w-5 text-primary" />
                Order Total
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-4">
                {chargeEntries(orderData.aggregatedPricing.charges).map(([name, amount]) => (
                  <div key={name} className="grid grid-cols-[1fr,auto] items-center gap-2">
                    <span className="text-sm">{formatChargeName(name)}</span>
                    <span className="font-medium text-right">{formatCurrency(amount)}</span>
                  </div>
                ))}

                <Separator className="my-2" />

                <div className="grid grid-cols-[1fr,auto] items-center gap-2">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-lg text-primary text-right">
                    {quoteRequired ? "Pending quote" : formatCurrency(orderData.aggregatedPricing.totalAmount)}
                  </span>
                </div>

                {!quoteRequired && (
                  <div className="ship-now-summary-detail-cell flex items-center justify-between gap-3 p-3 rounded-md">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="priority-delivery"
                        checked={isPriorityDelivery}
                        onCheckedChange={handlePriorityToggle}
                        disabled={isBusy}
                      />
                      <Label htmlFor="priority-delivery" className="font-medium text-sm">
                        {isUpdatingPriority ? "Updating..." : "Priority Delivery"}
                      </Label>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          aria-label="About priority delivery"
                          className="rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[280px] text-sm" side="top" align="start">
                        Priority Delivery gives your shipment expedited handling. We aim to complete delivery within
                        three hours whenever conditions allow.
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {quoteRequired ? (
                  <Alert className="border-amber-300 bg-amber-50 text-amber-950">
                    {quoteRequested ? <CheckCircle2 className="h-4 w-4" /> : <FileQuestion className="h-4 w-4" />}
                    <AlertTitle>{quoteRequested ? "Quote request sent" : "Custom quote required"}</AlertTitle>
                    <AlertDescription className="space-y-3">
                      {quoteRequested ? (
                        <p>Our team will review this order and prepare a manual quote.</p>
                      ) : (
                        <>
                          {rootQuoteReasons(orderData).map((reason, index) => (
                            <p key={`${reason}-${index}`}>{reason}</p>
                          ))}
                          {rootQuoteReasons(orderData).length === 0 && (
                            <p>One or more packages are outside the available pricing slabs.</p>
                          )}
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Button
                    onClick={onProceedToPayment}
                    className="w-full bg-primary hover:bg-primary/90 flex items-center justify-center gap-2 py-6"
                    disabled={isBusy}
                  >
                    <CreditCard className="h-4 w-4" />
                    Proceed to Payment
                  </Button>
                )}

                {quoteRequired && !quoteRequested && (
                  <Button
                    type="button"
                    onClick={handleRequestQuote}
                    className="w-full"
                    disabled={isBusy}
                  >
                    {isRequestingQuote ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileQuestion className="mr-2 h-4 w-4" />}
                    Ask for a quote
                  </Button>
                )}

                {quoteRequired ? (
                  <Button type="button" variant="outline" onClick={onCancelOrder} className="w-full" disabled={isBusy}>
                    Cancel order
                  </Button>
                ) : (
                  <Button variant="outline" onClick={onBack} className="w-full flex items-center justify-center gap-2" disabled={isBusy}>
                    <ArrowLeft className="h-4 w-4" />
                    Back to Review
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {!quoteRequired && (
            <div className="ship-now-flow-note text-sm text-muted-foreground p-4 rounded-md">
              <p>
                By proceeding to payment, you agree to our{" "}
                <a href="/terms" className="text-primary hover:underline">Terms of Service</a>{" "}
                and{" "}
                <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
