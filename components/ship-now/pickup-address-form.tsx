"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { Address } from "@/components/ship-now/ship-now-form"
import { AddressForm } from "@/components/ship-now/address-form"
import { Plus, Loader2, ArrowRight } from "lucide-react"
import { getAddresses } from "@/lib/address-service"
import { useAuth } from "@/lib/auth-context"

interface PickupAddressFormProps {
  selectedAddress: Address | null
  onSelectAddress: (address: Address, saveForFuture: boolean) => void
  onNext: () => void
  onBack: () => void
}

export function PickupAddressForm({ selectedAddress, onSelectAddress, onNext, onBack }: PickupAddressFormProps) {
  const { user } = useAuth()
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(selectedAddress?.id || null)

  // Fetch saved addresses when component mounts
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        const addresses = await getAddresses(user.userId, user.userType)
        setSavedAddresses(addresses)
      } catch (err) {
        console.error("Error fetching addresses:", err)
        setError("Failed to load saved addresses")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAddresses()
  }, [user])

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId)
    const address = savedAddresses.find((addr) => addr.addressId === addressId)
    if (address) {
      // Convert to the format expected by the form
      const formattedAddress: Address = {
        id: address.addressId,
        fullName: address.fullName,
        company: address.company || "",
        streetAddress: address.streetAddress,
        addressLine2: address.addressLine2 || "",
        city: address.city,
        province: address.province,
        postalCode: address.postalCode,
        country: address.country,
        phoneNumber: address.phoneNumber,
        deliveryInstructions: address.deliveryInstructions || "",
        addressType: "pickup",
        isPrimary: address.isPrimary || false,
        coordinates: address.coordinates,
      }
      onSelectAddress(formattedAddress, false)
      // No longer automatically proceed to next step
    }
    setShowNewAddressForm(false)
  }

  const handleNewAddressClick = () => {
    setSelectedAddressId(null)
    setShowNewAddressForm(true)
  }

  const handleAddressSubmit = (address: Address, saveForFuture: boolean) => {
    // Add addressType for pickup
    const addressWithType = {
      ...address,
      addressType: "pickup",
    }
    onSelectAddress(addressWithType, saveForFuture)
    // Proceed to next step - keep this behavior for new addresses
    onNext()
  }

  // New function to handle continuing with the selected address
  const handleContinue = () => {
    if (selectedAddressId) {
      onNext()
    }
  }

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Loading saved addresses...</p>
        </div>
    )
  }

  return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Pickup Address</h1>
        </div>

        {error && <p className="text-red-500 text-center">{error}</p>}

        {!showNewAddressForm ? (
            <div className="space-y-4">
              {/* Add new address button at the top */}
              <Button
                  variant="outline"
                  onClick={handleNewAddressClick}
                  className="w-full flex items-center justify-center gap-2 py-6 mb-6"
              >
                <Plus className="h-5 w-5 text-primary" />
                <span>Add a new address</span>
              </Button>

              {/* Divider with "or" text */}
              {savedAddresses.length > 0 && (
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-4 text-sm text-gray-500">or select a saved address</span>
                    </div>
                  </div>
              )}

              {savedAddresses.length > 0 && (
                  <RadioGroup value={selectedAddressId || ""} onValueChange={handleAddressSelect} className="space-y-3">
                    {savedAddresses.map((address) => (
                        <div key={address.addressId} className="flex items-start space-x-3">
                          <RadioGroupItem
                              value={address.addressId || ""}
                              id={`address-${address.addressId}`}
                              className="mt-1"
                          />
                          <div className="flex-1">
                            <Label htmlFor={`address-${address.addressId}`} className="flex items-start cursor-pointer">
                              <Card className="w-full">
                                <CardContent className="p-4">
                                  <div className="flex justify-between">
                                    <div>
                                      <p className="font-medium">{address.fullName}</p>
                                      {address.company && <p className="text-muted-foreground text-sm">{address.company}</p>}
                                      <p className="mt-1">
                                        {address.streetAddress}
                                        {address.addressLine2 && `, ${address.addressLine2}`}
                                      </p>
                                      <p>
                                        {address.city}, {address.province} {address.postalCode}
                                      </p>
                                      <p>{address.country}</p>
                                      <p className="mt-1">{address.phoneNumber}</p>
                                      {address.deliveryInstructions && (
                                          <p className="mt-1 text-sm italic">{address.deliveryInstructions}</p>
                                      )}
                                    </div>
                                    {address.isPrimary && (
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Primary</span>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </Label>
                          </div>
                        </div>
                    ))}
                  </RadioGroup>
              )}

              {savedAddresses.length === 0 && (
                  <div className="mt-6">
                    <Card className="border-dashed">
                      <CardContent className="p-6 text-center">
                        <p className="mb-4 text-muted-foreground">You don't have any saved addresses yet.</p>
                        <p className="text-sm text-muted-foreground">Please add a new address using the button above.</p>
                      </CardContent>
                    </Card>
                  </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onBack}>
                  Back
                </Button>
                {/* Add Continue button that's enabled only when an address is selected */}
                <Button onClick={handleContinue} disabled={!selectedAddressId} className="flex items-center gap-2">
                  Continue
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
        ) : (
            <div className="mt-6">
              <AddressForm onSubmit={handleAddressSubmit} addressType="pickup" initialAddress={null} />
              <div className="mt-4">
                <Button variant="outline" onClick={() => setShowNewAddressForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
        )}
      </div>
  )
}

