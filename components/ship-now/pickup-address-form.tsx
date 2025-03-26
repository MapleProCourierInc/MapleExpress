"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { Address } from "@/components/ship-now/ship-now-form"
import { AddressForm } from "@/components/ship-now/address-form"
import { Plus } from "lucide-react"

interface PickupAddressFormProps {
  selectedAddress: Address | null
  savedAddresses: Address[]
  onSelectAddress: (address: Address) => void
  onNext: () => void
  onBack: () => void
  canProceed: boolean
}

export function PickupAddressForm({
  selectedAddress,
  savedAddresses,
  onSelectAddress,
  onNext,
  onBack,
  canProceed,
}: PickupAddressFormProps) {
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(selectedAddress?.id || null)

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId)
    const address = savedAddresses.find((addr) => addr.id === addressId)
    if (address) {
      onSelectAddress(address)
    }
    setShowNewAddressForm(false)
  }

  const handleNewAddressSelect = () => {
    setSelectedAddressId(null)
    setShowNewAddressForm(true)
  }

  const handleAddressSubmit = (address: Address) => {
    // Add addressType for pickup
    const addressWithType = {
      ...address,
      addressType: "pickup",
    }
    onSelectAddress(addressWithType)
    setShowNewAddressForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Pickup Address</h1>
        <p className="text-muted-foreground mt-2">Select an address for package pickup or add a new one</p>
      </div>

      <div className="space-y-4">
        {savedAddresses.length > 0 && (
          <RadioGroup value={selectedAddressId || ""} onValueChange={handleAddressSelect} className="space-y-3">
            {savedAddresses.map((address) => (
              <div key={address.id} className="flex items-start space-x-3">
                <RadioGroupItem value={address.id || ""} id={`address-${address.id}`} className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor={`address-${address.id}`} className="flex items-start cursor-pointer">
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

            <div className="flex items-start space-x-3">
              <RadioGroupItem
                value="new"
                id="address-new"
                checked={showNewAddressForm}
                onCheckedChange={() => handleNewAddressSelect()}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="address-new" className="flex items-center cursor-pointer">
                  <Card className="w-full">
                    <CardContent className="p-4 flex items-center gap-2">
                      <Plus className="h-5 w-5 text-primary" />
                      <span>Add a new address</span>
                    </CardContent>
                  </Card>
                </Label>
              </div>
            </div>
          </RadioGroup>
        )}

        {(showNewAddressForm || savedAddresses.length === 0) && (
          <div className="mt-6">
            <AddressForm onSubmit={handleAddressSubmit} addressType="pickup" initialAddress={null} />
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          Continue to Delivery Address
        </Button>
      </div>
    </div>
  )
}

