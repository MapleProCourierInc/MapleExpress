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
}

// Define the shipping order type
export type ShippingOrder = {
  packages: PackageItem[]
  pickupAddress: Address | null
}

// Define the steps for the shipping process
type ShippingStep = "PACKAGE_DETAILS" | "PICKUP_ADDRESS" | "DROPOFF_ADDRESS" | "ADD_MORE" | "REVIEW" | "SUCCESS"

export function ShipNowForm() {
  const { user, individualProfile, organizationProfile } = useAuth()
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

  // Get user addresses from profile
  const userAddresses = individualProfile?.address || organizationProfile?.address || []

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
    setOrder((prev) => ({
      ...prev,
      packages: prev.packages.map((pkg, index) =>
          index === currentPackageIndex ? { ...pkg, ...updatedPackage } : pkg,
      ),
    }))
  }

  // Handle setting pickup address
  const handleSetPickupAddress = (address: Address) => {
    setOrder((prev) => ({
      ...prev,
      pickupAddress: address,
    }))
  }

  // Handle setting dropoff address for current package
  const handleSetDropoffAddress = (address: Address) => {
    handleUpdatePackage({ dropoffAddress: address })
  }

  // Handle form submission
  const handleSubmitOrder = async () => {
    // Here you would submit the order to your backend
    console.log("Submitting order:", order)

    // For now, just move to the success step
    setCurrentStep("SUCCESS")
  }

  // Handle continuing to add more or review
  const handleContinueAfterDropoff = () => {
    setCurrentStep("ADD_MORE")
  }

  // Handle skipping add more and going to review
  const handleGoToReview = () => {
    setCurrentStep("REVIEW")
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

  // Determine if the current step is valid and can proceed
  const canProceed = () => {
    switch (currentStep) {
      case "PACKAGE_DETAILS":
        return (
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

  // Handle next step
  const handleNextStep = () => {
    switch (currentStep) {
      case "PACKAGE_DETAILS":
        if (order.pickupAddress === null) {
          setCurrentStep("PICKUP_ADDRESS")
        } else {
          setCurrentStep("DROPOFF_ADDRESS")
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

  return (
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <ShippingSteps currentStep={getStepNumber()} />

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
                    savedAddresses={userAddresses}
                    onSelectAddress={handleSetPickupAddress}
                    onNext={handleNextStep}
                    onBack={handlePrevStep}
                    canProceed={canProceed()}
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
                      savedAddresses={userAddresses}
                      onSelectAddress={handleSetDropoffAddress}
                      onNext={handleContinueAfterDropoff}
                      onBack={handlePrevStep}
                      canProceed={canProceed()}
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
                <ReviewOrder order={order} onSubmit={handleSubmitOrder} onBack={handlePrevStep} />
            )}

            {currentStep === "SUCCESS" && (
                <ShippingSuccess orderNumber={"SHP" + Math.floor(100000 + Math.random() * 900000)} />
            )}
          </div>
        </div>
      </div>
  )
}

