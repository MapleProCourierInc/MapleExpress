"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { ShippingSteps } from "@/components/ship-now/shipping-steps"
import { PackageDetailsForm } from "@/components/ship-now/package-details-form"
import { PickupAddressForm } from "@/components/ship-now/pickup-address-form"
import { DropoffAddressForm } from "@/components/ship-now/dropoff-address-form"
import { ReviewOrder } from "@/components/ship-now/review-order"
import { ShippingSuccess } from "@/components/ship-now/shipping-success"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft } from "lucide-react"
import { createAddress } from "@/lib/address-service"
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
  dropoffAddress: Address | null
}

// Define the address type
export type Address = {
  id?: string
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

// Define the steps for the shipping process
type ShippingStep = "PACKAGE_DETAILS" | "PICKUP_ADDRESS" | "DROPOFF_ADDRESS" | "ADD_MORE" | "REVIEW" | "SUCCESS"

export function ShipNowForm() {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState<ShippingStep>("PACKAGE_DETAILS")
  const [currentPackageIndex, setCurrentPackageIndex] = useState(0)
  const [order, setOrder] = useState<ShippingOrder>({
    packages: [
      {
        id: "pkg-" + Date.now(),
        length: 0,
        width: 0,
        height: 0,
        weight: 0,
        contents: "",
        fragile: false,
        dropoffAddress: null,
      },
    ],
    pickupAddress: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [packageToDelete, setPackageToDelete] = useState<number | null>(null)

  // Get current package
  const currentPackage = order.packages[currentPackageIndex]

  // Handle adding a new package
  const handleAddPackage = () => {
    setOrder((prev) => ({
      ...prev,
      packages: [
        ...prev.packages,
        {
          id: "pkg-" + Date.now(),
          length: 0,
          width: 0,
          height: 0,
          weight: 0,
          contents: "",
          fragile: false,
          dropoffAddress: null,
        },
      ],
    }))
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
  }

  // Handle setting pickup address
  const handleSetPickupAddress = async (address: Address, saveForFuture: boolean) => {
    setOrder((prev) => ({
      ...prev,
      pickupAddress: address,
    }))

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

        await createAddress(user.userId, addressData)
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

        await createAddress(user.userId, addressData)
      } catch (err) {
        console.error("Error saving address:", err)
        setError("Failed to save address for future use, but your order will continue.")
      }
    }
  }

  // Handle form submission
  const handleSubmitOrder = async () => {
    // Here you would submit the order to your backend
    setIsSubmitting(true)
    try {
      console.log("Submitting order:", order)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      // For now, just move to the success step
      setCurrentStep("SUCCESS")
    } catch (err) {
      console.error("Error submitting order:", err)
      setError("Failed to submit order. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

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
  const confirmDeletePackage = () => {
    if (packageToDelete === null) return

    setOrder((prev) => {
      const updatedPackages = [...prev.packages]
      updatedPackages.splice(packageToDelete, 1)

      return {
        ...prev,
        packages: updatedPackages,
      }
    })

    // If we're deleting the current package, adjust the current package index
    if (packageToDelete === currentPackageIndex) {
      setCurrentPackageIndex(Math.max(0, packageToDelete - 1))
    } else if (packageToDelete < currentPackageIndex) {
      // If we're deleting a package before the current one, adjust the index
      setCurrentPackageIndex(currentPackageIndex - 1)
    }

    setShowDeleteDialog(false)
    setPackageToDelete(null)
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
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <ShippingSteps currentStep={getStepNumber()} />

          {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">{error}</div>}

          <div className="mt-8 bg-white rounded-lg shadow-md p-6 transition-all duration-300">
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
                        <Plus className="h-5 w-5" />
                        <div>
                          <div className="font-semibold">Add Package</div>
                          <div className="text-xs">Ship to another address</div>
                        </div>
                      </Button>

                      <Button
                          variant="outline"
                          onClick={handleGoToReview}
                          className="flex items-center justify-center gap-2 h-auto py-6"
                      >
                        <ArrowLeft className="h-5 w-5" />
                        <div>
                          <div className="font-semibold">Continue</div>
                          <div className="text-xs">Review your order</div>
                        </div>
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
                    onSubmit={handleSubmitOrder}
                    onBack={handlePrevStep}
                    onEditPackage={handleEditPackage}
                    onDeletePackage={handleDeletePackage}
                    onEditPickupAddress={handleEditPickupAddress}
                    isSubmitting={isSubmitting}
                />
            )}

            {currentStep === "SUCCESS" && (
                <ShippingSuccess orderNumber={"SHP" + Math.floor(100000 + Math.random() * 900000)} />
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
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                  onClick={confirmDeletePackage}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  )
}

