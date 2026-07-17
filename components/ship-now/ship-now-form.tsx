"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation';
import { useAuth } from "@/lib/auth-context"
import { ShippingSteps } from "@/components/ship-now/shipping-steps"
import { PackageDetailsForm } from "@/components/ship-now/package-details-form"
import { PickupAddressForm } from "@/components/ship-now/pickup-address-form"
import { DropoffAddressForm } from "@/components/ship-now/dropoff-address-form"
import { ReviewOrder } from "@/components/ship-now/review-order"
import { OrderPricing } from "@/components/ship-now/order-pricing"
import { PaymentForm } from "@/components/ship-now/payment-form"
import { ShippingSuccess } from "@/components/ship-now/shipping-success"
import { Button } from "@/components/ui/button"
import { Plus, ArrowRight } from "lucide-react"
import { createAddress } from "@/lib/address-service"
import {
  cancelOrder,
  createDraftOrder,
  getClientOrderDetail,
  removeOrderItems,
  type OrderItemResponse,
  type OrderResponse,
  type ShippingOrder as StoredShippingOrder,
} from "@/lib/order-service"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Define the package item type
export type PackageItem = {
  id: string
  length: number
  width: number
  height: number
  weight: number
  contents: string
  fragile: boolean
  signatureRequired: boolean
  dropoffAddress: Address | null
}

// Define the address type
export type Address = {
  id?: string
  addressId?: string
  fullName: string
  company?: string
  streetAddress: string
  addressLine2?: string
  city: string
  province: string
  postalCode: string
  country: string
  phoneNumber: string
  deliveryInstructions?: string
  addressType: string
  isPrimary?: boolean
  coordinates?: {
    latitude: number
    longitude: number
  }
}

// Define the shipping order type
export type ShippingOrder = {
  packages: PackageItem[]
  pickupAddress: Address | null
}

const createEmptyPackage = (): PackageItem => ({
  id: "pkg-" + Date.now(),
  length: 0,
  width: 0,
  height: 0,
  weight: 0,
  contents: "",
  fragile: false,
  signatureRequired: false,
  dropoffAddress: null,
})

// Define the steps for the shipping process
type ShippingStep =
    | "PACKAGE_DETAILS"
    | "PICKUP_ADDRESS"
    | "DROPOFF_ADDRESS"
    | "ADD_MORE"
    | "REVIEW"
    | "PRICING"
    | "PAYMENT"
    | "SUCCESS"

function storedAddressToFormAddress(
  address: NonNullable<NonNullable<NonNullable<StoredShippingOrder["orderItems"]>[number]["pickup"]>["address"]> | null | undefined,
  addressType: string,
): Address {
  return {
    fullName: address?.fullName || "Shipping Customer",
    company: address?.company || "",
    streetAddress: address?.streetAddress || "Address not provided",
    addressLine2: address?.addressLine2 || "",
    city: address?.city || "Unknown",
    province: address?.province || "Unknown",
    postalCode: address?.postalCode || "Unknown",
    country: address?.country || "CA",
    phoneNumber: address?.phoneNumber || "Unknown",
    deliveryInstructions: address?.deliveryInstructions || "",
    addressType,
  }
}

function storedAddressToResponseAddress(
  address: NonNullable<NonNullable<NonNullable<StoredShippingOrder["orderItems"]>[number]["pickup"]>["address"]> | null | undefined,
) {
  return {
    fullName: address?.fullName || "Shipping Customer",
    company: address?.company || "",
    streetAddress: address?.streetAddress || "Address not provided",
    addressLine2: address?.addressLine2 || "",
    city: address?.city || "Unknown",
    province: address?.province || "Unknown",
    postalCode: address?.postalCode || "Unknown",
    country: address?.country || "CA",
    phoneNumber: address?.phoneNumber || "Unknown",
    deliveryInstructions: address?.deliveryInstructions || "",
  }
}

function storedOrderToDraftOrder(order: StoredShippingOrder): OrderResponse {
  const currency = order.aggregatedPricing?.currency || "CAD"
  const orderItems: OrderItemResponse[] = (order.orderItems || []).map((item) => ({
    orderItemId: item.orderItemId || undefined,
    trackingId: item.trackingId || undefined,
    pickup: {
      address: storedAddressToResponseAddress(item.pickup?.address),
      coordinates: item.pickup?.coordinates
        ? {
            latitude: Number(item.pickup.coordinates.latitude || 0),
            longitude: Number(item.pickup.coordinates.longitude || 0),
          }
        : undefined,
      time: item.pickup?.time || "",
      notes: item.pickup?.notes || "",
      images: Array.isArray(item.pickup?.images) ? item.pickup.images : [],
    },
    dropoff: {
      address: storedAddressToResponseAddress(item.dropoff?.address),
      coordinates: item.dropoff?.coordinates
        ? {
            latitude: Number(item.dropoff.coordinates.latitude || 0),
            longitude: Number(item.dropoff.coordinates.longitude || 0),
          }
        : undefined,
      time: item.dropoff?.time || "",
      notes: item.dropoff?.notes || "",
      images: Array.isArray(item.dropoff?.images) ? item.dropoff.images : [],
    },
    distanceToDelivery: Number(item.distanceToDelivery || 0),
    packageDetails: {
      weight: Number(item.packageDetails?.weight || 0),
      dimensions: {
        length: Number(item.packageDetails?.dimensions?.length || 0),
        width: Number(item.packageDetails?.dimensions?.width || 0),
        height: Number(item.packageDetails?.dimensions?.height || 0),
      },
      type: item.packageDetails?.type || null,
      value: item.packageDetails?.value || null,
      images: [],
    },
    isFragile: Boolean(item.isFragile),
    signatureRequired: Boolean(item.signatureRequired),
    pricing: {
      currency: item.pricing?.currency || currency,
      customQuoteRequired: Boolean(item.pricing?.customQuoteRequired),
      customQuoteReason: item.pricing?.customQuoteReason || null,
      charges: item.pricing?.charges || {},
      calculationContext: null,
      metadata: null,
    },
    itemStatus: item.itemStatus || "",
    description: item.description || null,
    trackingNumber: item.trackingId || null,
    estimatedDeliveryTime: item.estimatedDeliveryTime || null,
    specialIncidents: Array.isArray(item.specialIncidents) ? item.specialIncidents : [],
    trackingEvents: item.trackingEvents || [],
  }))

  return {
    shippingOrderId: order.shippingOrderId,
    customerId: order.clientUserId || order.userId || "",
    customerContact: {
      name: order.customerContact?.name || "",
      phone: order.customerContact?.phone || "",
      email: order.customerContact?.email || "",
    },
    priorityDelivery: Boolean(order.priorityDelivery),
    orderStatus: order.orderStatus || "",
    paymentStatus: order.paymentStatus || "",
    createdAt: order.createdAt || "",
    updatedAt: order.updatedAt || "",
    aggregatedPricing: {
      currency,
      customQuoteRequired: Boolean(order.aggregatedPricing?.customQuoteRequired),
      customQuoteReasons: order.aggregatedPricing?.customQuoteReasons || [],
      charges: order.aggregatedPricing?.charges || {},
      totalAmount: Number(order.aggregatedPricing?.totalAmount || 0),
    },
    orderItems,
  }
}

function storedOrderToFormOrder(order: StoredShippingOrder): ShippingOrder {
  const items = order.orderItems || []
  return {
    pickupAddress: storedAddressToFormAddress(items[0]?.pickup?.address, "pickup"),
    packages: items.length
      ? items.map((item, index) => ({
          id: item.orderItemId || item.trackingId || `pkg-${index}`,
          length: Number(item.packageDetails?.dimensions?.length || 0),
          width: Number(item.packageDetails?.dimensions?.width || 0),
          height: Number(item.packageDetails?.dimensions?.height || 0),
          weight: Number(item.packageDetails?.weight || 0),
          contents: item.description || item.packageDetails?.type || "",
          fragile: Boolean(item.isFragile),
          signatureRequired: Boolean(item.signatureRequired),
          dropoffAddress: storedAddressToFormAddress(item.dropoff?.address, "dropoff"),
        }))
      : [createEmptyPackage()],
  }
}

export function ShipNowForm({ resumePaymentOrderId }: { resumePaymentOrderId?: string | null } = {}) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState<ShippingStep>("PACKAGE_DETAILS")
  const [currentPackageIndex, setCurrentPackageIndex] = useState(0)
  const [order, setOrder] = useState<ShippingOrder>({
    packages: [createEmptyPackage()],
    pickupAddress: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [packageToDelete, setPackageToDelete] = useState<number | null>(null)
  const [isPriorityDelivery, setIsPriorityDelivery] = useState(false)
  const [draftOrder, setDraftOrder] = useState<OrderResponse | null>(null)
  const [hasDraftChanges, setHasDraftChanges] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [isResumingPayment, setIsResumingPayment] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const router = useRouter();

  useEffect(() => {
    setError(null)
  }, [currentStep])

  useEffect(() => {
    const orderToResume = resumePaymentOrderId?.trim()
    if (!orderToResume || !user?.userId) return

    let cancelled = false
    setIsResumingPayment(true)
    setError(null)

    getClientOrderDetail(orderToResume)
      .then((detail) => {
        if (cancelled) return
        if (!detail.shippingOrder) {
          throw new Error("We could not load this order for payment.")
        }

        const resumedDraftOrder = storedOrderToDraftOrder(detail.shippingOrder)
        setDraftOrder(resumedDraftOrder)
        setOrder(storedOrderToFormOrder(detail.shippingOrder))
        setIsPriorityDelivery(Boolean(resumedDraftOrder.priorityDelivery))
        setHasDraftChanges(false)
        setCurrentStep("PAYMENT")
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error && err.message ? err.message : "We could not load this order for payment.")
      })
      .finally(() => {
        if (!cancelled) setIsResumingPayment(false)
      })

    return () => {
      cancelled = true
    }
  }, [resumePaymentOrderId, user?.userId])

  // Get current package
  const currentPackage = order.packages[currentPackageIndex]

  // Handle adding a new package
  const handleAddPackage = () => {
    setOrder((prev) => ({
      ...prev,
      packages: [
        ...prev.packages,
        createEmptyPackage(),
      ],
    }))
    setHasDraftChanges(true)
    setCurrentPackageIndex(order.packages.length)
    setCurrentStep("PACKAGE_DETAILS")
  }

  // Handle updating a package
  const handleUpdatePackage = (updatedPackage: Partial<PackageItem>) => {
    setOrder((prev) => {
      const updatedPackages = [...prev.packages]
      updatedPackages[currentPackageIndex] = {
        ...updatedPackages[currentPackageIndex],
        ...updatedPackage,
      }

      return {
        ...prev,
        packages: updatedPackages,
      }
    })
    setHasDraftChanges(true)
  }

  const handleUpdatePackageAtIndex = (packageIndex: number, updatedPackage: Partial<PackageItem>) => {
    setOrder((prev) => {
      if (!prev.packages[packageIndex]) return prev

      const updatedPackages = [...prev.packages]
      updatedPackages[packageIndex] = {
        ...updatedPackages[packageIndex],
        ...updatedPackage,
      }

      return {
        ...prev,
        packages: updatedPackages,
      }
    })
    setHasDraftChanges(true)
  }

  // Handle setting pickup address
  const handleSetPickupAddress = async (address: Address, saveForFuture: boolean) => {
    setOrder((prev) => ({
      ...prev,
      pickupAddress: address,
    }))
    setHasDraftChanges(true)

    // Save address to database if requested
    if (saveForFuture && user) {
      try {
        // Convert to the format expected by the API
        const addressData = {
          fullName: address.fullName,
          company: address.company,
          streetAddress: address.streetAddress,
          addressLine2: address.addressLine2,
          city: address.city,
          province: address.province,
          postalCode: address.postalCode,
          country: address.country,
          phoneNumber: address.phoneNumber,
          deliveryInstructions: address.deliveryInstructions,
          addressType: address.addressType,
          isPrimary: address.isPrimary || false,
          coordinates: address.coordinates,
        }

        await createAddress(addressData)
      } catch (err) {
        console.error("Error saving address:", err)
        setError("Failed to save address for future use, but your order will continue.")
      }
    }
  }

  // Handle setting dropoff address for current package
  const handleSetDropoffAddress = async (address: Address, saveForFuture: boolean) => {
    handleUpdatePackage({ dropoffAddress: address })

    // Save address to database if requested
    if (saveForFuture && user) {
      try {
        // Convert to the format expected by the API
        const addressData = {
          fullName: address.fullName,
          company: address.company,
          streetAddress: address.streetAddress,
          addressLine2: address.addressLine2,
          city: address.city,
          province: address.province,
          postalCode: address.postalCode,
          country: address.country,
          phoneNumber: address.phoneNumber,
          deliveryInstructions: address.deliveryInstructions,
          addressType: address.addressType,
          isPrimary: address.isPrimary || false,
          coordinates: address.coordinates,
        }

        await createAddress(addressData)
      } catch (err) {
        console.error("Error saving address:", err)
        setError("Failed to save address for future use, but your order will continue.")
      }
    }
  }

  // Handle creating draft order
  const handleCreateDraftOrder = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      if (!user) {
        throw new Error("User not authenticated")
      }

      if (draftOrder && !hasDraftChanges) {
        setCurrentStep("PRICING")
        return
      }

      // Call the API to create a draft order
      const draftOrderResponse = await createDraftOrder(order, user.userId, isPriorityDelivery, draftOrder?.shippingOrderId)
      setDraftOrder(draftOrderResponse)
      setHasDraftChanges(false)

      // Move to the pricing step
      setCurrentStep("PRICING")
    } catch (err) {
      console.error("Error creating draft order:", err)
      setError(err instanceof Error && err.message ? err.message : "Failed to create order. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle updating the order (e.g., when priority delivery is toggled)
  const handleOrderUpdate = (updatedOrder: OrderResponse) => {
    setDraftOrder(updatedOrder)
    setIsPriorityDelivery(updatedOrder.priorityDelivery)
    setHasDraftChanges(false)
  }

  const removeLocalPackage = (packageIndex: number, markDraftChanged = true) => {
    setOrder((prev) => ({
      ...prev,
      packages: prev.packages.filter((_, index) => index !== packageIndex),
    }))
    setCurrentPackageIndex((currentIndex) => {
      if (currentIndex === packageIndex) return Math.max(0, packageIndex - 1)
      if (packageIndex < currentIndex) return currentIndex - 1
      return currentIndex
    })
    setHasDraftChanges(markDraftChanged)
  }

  const removeDraftPackage = async (packageIndex: number) => {
    if (!draftOrder) {
      removeLocalPackage(packageIndex)
      return
    }

    const trackingId = draftOrder.orderItems[packageIndex]?.trackingId

    if (!trackingId) {
      // Packages appended after returning to review do not exist in the draft yet.
      if (packageIndex >= draftOrder.orderItems.length) {
        removeLocalPackage(packageIndex)
        return
      }

      throw new Error("This package cannot be removed because its tracking ID is missing.")
    }

    const updatedDraftOrder = await removeOrderItems(draftOrder.shippingOrderId, [trackingId])
    removeLocalPackage(packageIndex, false)
    setDraftOrder(updatedDraftOrder)
    setIsPriorityDelivery(updatedDraftOrder.priorityDelivery)
  }

  const handleRemovePackageFromPricing = async (packageIndex: number) => {
    if (!draftOrder) {
      throw new Error("Unable to update the draft order.")
    }

    if (order.packages.length <= 1) {
      throw new Error("An order must contain at least one package.")
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await removeDraftPackage(packageIndex)
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Failed to remove package. Please try again.")
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetDraftOrderFlow = () => {
    setOrder({
      packages: [createEmptyPackage()],
      pickupAddress: null,
    })
    setCurrentPackageIndex(0)
    setIsPriorityDelivery(false)
    setDraftOrder(null)
    setHasDraftChanges(false)
    setError(null)
    setCurrentStep("PACKAGE_DETAILS")
  }

  const handleCancelOrder = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      if (draftOrder?.shippingOrderId) {
        await cancelOrder(draftOrder.shippingOrderId)
      }

      resetDraftOrderFlow()
    } catch (err) {
      console.error("Error cancelling order:", err)
      setError(err instanceof Error && err.message ? err.message : "Failed to cancel order. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle proceeding to payment
  const handleProceedToPayment = () => {
    setCurrentStep("PAYMENT")
  }

  // Handle payment completion
  const handlePaymentComplete = (completedOrderId: string) => {
    setOrderId(completedOrderId);
    if (draftOrder) {
      // Construct query parameters for the confirmation page
      // For pickup/dropoff names, using the first item as a general representation.
      // This might need adjustment if a more detailed breakdown is required for multi-item/multi-destination orders on the confirmation page.
      const pickupAddress = draftOrder.orderItems[0]?.pickup?.address;
      const dropoffAddress = draftOrder.orderItems[0]?.dropoff?.address;

      const queryParams = new URLSearchParams({
        orderId: completedOrderId,
        total: draftOrder.aggregatedPricing.totalAmount.toString(),
        pickup: pickupAddress?.fullName || order.pickupAddress?.fullName || "N/A",
        dropoff: dropoffAddress?.fullName || "Multiple Destinations", // Fallback for multi-package different destinations
        items: draftOrder.orderItems.length.toString()
      }).toString();
      router.push(`/order-confirmation?${queryParams}`);
    } else {
      // Fallback if draftOrder is somehow null, though it shouldn't be at this stage.
      // Redirect with minimal info.
      console.warn("draftOrder was null during handlePaymentComplete. Redirecting with only orderId.");
      router.push(`/order-confirmation?orderId=${completedOrderId}`);
    }
  };

  // Handle continuing to add more or review
  const handleContinueAfterDropoff = () => {
    setCurrentStep("ADD_MORE")
  }

  // Handle skipping add more and going to review
  const handleGoToReview = () => {
    setCurrentStep("REVIEW")
  }

  // Handle editing a package from the review step
  const handleEditPackage = (packageIndex: number) => {
    setCurrentPackageIndex(packageIndex)
    setCurrentStep("PACKAGE_DETAILS")
  }

  // Handle deleting a package
  const handleDeletePackage = (packageIndex: number) => {
    // If it's the only package, don't allow deletion
    if (order.packages.length <= 1) {
      return
    }

    setPackageToDelete(packageIndex)
    setShowDeleteDialog(true)
  }

  // Confirm package deletion
  const confirmDeletePackage = async () => {
    if (packageToDelete === null) return

    setIsSubmitting(true)
    setError(null)
    try {
      await removeDraftPackage(packageToDelete)
    } catch (err) {
      console.error("Error removing package:", err)
      setError(err instanceof Error && err.message ? err.message : "Failed to remove package. Please try again.")
    } finally {
      setIsSubmitting(false)
      setShowDeleteDialog(false)
      setPackageToDelete(null)
    }
  }

  // Handle editing pickup address from review step
  const handleEditPickupAddress = () => {
    setCurrentStep("PICKUP_ADDRESS")
  }

  // Get step number for progress indicator
  const getStepNumber = () => {
    switch (currentStep) {
      case "PACKAGE_DETAILS":
        return 0
      case "PICKUP_ADDRESS":
        return 1
      case "DROPOFF_ADDRESS":
        return 2
      case "ADD_MORE":
      case "REVIEW":
        return 3
      case "PRICING":
      case "PAYMENT":
        return 4
      default:
        return 0
    }
  }

  // Handle next step
  const handleNextStep = () => {
    switch (currentStep) {
      case "PACKAGE_DETAILS":
        if (canProceed()) {
          if (order.pickupAddress === null) {
            setCurrentStep("PICKUP_ADDRESS")
          } else {
            setCurrentStep("DROPOFF_ADDRESS")
          }
        }
        break
      case "PICKUP_ADDRESS":
        setCurrentStep("DROPOFF_ADDRESS")
        break
      case "DROPOFF_ADDRESS":
        setCurrentStep("ADD_MORE")
        break
      case "ADD_MORE":
        setCurrentStep("REVIEW")
        break
    }
  }

  // Handle previous step
  const handlePrevStep = () => {
    switch (currentStep) {
      case "PICKUP_ADDRESS":
        setCurrentStep("PACKAGE_DETAILS")
        break
      case "DROPOFF_ADDRESS":
        if (order.pickupAddress === null) {
          setCurrentStep("PACKAGE_DETAILS")
        } else {
          setCurrentStep("PICKUP_ADDRESS")
        }
        break
      case "ADD_MORE":
        setCurrentStep("DROPOFF_ADDRESS")
        break
      case "REVIEW":
        setCurrentStep("ADD_MORE")
        break
      case "PRICING":
        setCurrentStep("REVIEW")
        break
      case "PAYMENT":
        setCurrentStep("PRICING")
        break
    }
  }

  // Update the canProceed function to properly validate package details
  const canProceed = () => {
    switch (currentStep) {
      case "PACKAGE_DETAILS":
        return (
            currentPackage &&
            currentPackage.length > 0 &&
            currentPackage.width > 0 &&
            currentPackage.height > 0 &&
            currentPackage.weight > 0 &&
            currentPackage.contents.trim() !== ""
        )
      case "PICKUP_ADDRESS":
        return order.pickupAddress !== null
      case "DROPOFF_ADDRESS":
        return currentPackage.dropoffAddress !== null
      default:
        return true
    }
  }

  return (
      <div className="container py-16">
        <div className="max-w-5xl mx-auto">
          <ShippingSteps currentStep={getStepNumber()} />

          {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">{error}</div>}

          <div className="ship-now-card mt-10 rounded-lg p-8 shadow-lg transition-all duration-300">
            {isResumingPayment && (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <div>
                    <h2 className="text-xl font-bold">Loading payment</h2>
                    <p className="mt-2 text-muted-foreground">Fetching your accepted quote order.</p>
                  </div>
                </div>
            )}

            {!isResumingPayment && (
              <>
            {currentStep === "PACKAGE_DETAILS" && (
                <>
                  {order.packages.length > 1 && (
                      <div className="mb-6">
                        <h2 className="text-xl font-bold">Package {currentPackageIndex + 1}</h2>
                        <p className="text-muted-foreground">
                          Enter details for package {currentPackageIndex + 1} of {order.packages.length}
                        </p>
                      </div>
                  )}
                  <PackageDetailsForm
                      package={currentPackage}
                      onUpdatePackage={handleUpdatePackage}
                      onNext={handleNextStep}
                      canProceed={canProceed()}
                  />
                </>
            )}

            {currentStep === "PICKUP_ADDRESS" && (
                <PickupAddressForm
                    selectedAddress={order.pickupAddress}
                    onSelectAddress={handleSetPickupAddress}
                    onNext={handleNextStep}
                    onBack={handlePrevStep}
                />
            )}

            {currentStep === "DROPOFF_ADDRESS" && (
                <>
                  {order.packages.length > 1 && (
                      <div className="mb-6">
                        <h2 className="text-xl font-bold">Delivery Address for Package {currentPackageIndex + 1}</h2>
                        <p className="text-muted-foreground">Where should we deliver package {currentPackageIndex + 1}?</p>
                      </div>
                  )}
                  <DropoffAddressForm
                      selectedAddress={currentPackage.dropoffAddress}
                      onSelectAddress={handleSetDropoffAddress}
                      onNext={handleContinueAfterDropoff}
                      onBack={handlePrevStep}
                  />
                </>
            )}

            {currentStep === "ADD_MORE" && (
                <div className="py-8">
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold">Add Another Package?</h1>
                    <p className="text-muted-foreground mt-2">
                      You can add multiple packages to this shipping order with different destinations.
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
                      <Button onClick={handleAddPackage} className="flex items-center justify-center gap-2 h-auto py-6">
                        <div>
                          <div className="font-semibold">Add Package</div>
                          <div className="text-xs">Ship to another address</div>
                        </div>
                        <Plus className="h-5 w-5 ml-2" />
                      </Button>

                      <Button
                          variant="outline"
                          onClick={handleGoToReview}
                          className="flex items-center justify-center gap-2 h-auto py-6"
                      >
                        <div>
                          <div className="font-semibold">Continue</div>
                          <div className="text-xs">Review your order</div>
                        </div>
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    </div>

                    <div className="text-center text-sm text-muted-foreground mt-4">
                      <p>You currently have {order.packages.length} package(s) in this order</p>
                    </div>
                  </div>
                </div>
            )}

            {currentStep === "REVIEW" && (
                <ReviewOrder
                    order={order}
                    onSubmit={handleCreateDraftOrder}
                    onBack={handlePrevStep}
                    onEditPackage={handleEditPackage}
                    onUpdatePackage={handleUpdatePackageAtIndex}
                    onDeletePackage={handleDeletePackage}
                    onEditPickupAddress={handleEditPickupAddress}
                    isSubmitting={isSubmitting}
                />
            )}

            {currentStep === "PRICING" && draftOrder && (
                <OrderPricing
                    orderData={draftOrder}
                    onBack={handlePrevStep}
                    onCancelOrder={handleCancelOrder}
                    onProceedToPayment={handleProceedToPayment}
                    onRemovePackage={handleRemovePackageFromPricing}
                    isLoading={isSubmitting}
                    onOrderUpdate={handleOrderUpdate}
                />
            )}

            {currentStep === "PAYMENT" && draftOrder && (
                <PaymentForm
                    orderData={draftOrder}
                    onBack={handlePrevStep}
                    onPaymentComplete={handlePaymentComplete}
                    isProcessing={isProcessingPayment}
                />
            )}

            {currentStep === "SUCCESS" && <ShippingSuccess orderNumber={orderId || draftOrder?.shippingOrderId || ""} />}
              </>
            )}
          </div>
        </div>

        {/* Delete Package Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Package</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this package? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                  onClick={confirmDeletePackage}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isSubmitting}
              >
                {isSubmitting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  )
}
