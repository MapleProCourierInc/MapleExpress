"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { Address } from "@/components/ship-now/ship-now-form"

interface AddressFormProps {
  onSubmit: (address: Address) => void
  addressType: string
  initialAddress: Address | null
}

export function AddressForm({ onSubmit, addressType, initialAddress }: AddressFormProps) {
  const [address, setAddress] = useState<Address>(
    initialAddress || {
      fullName: "",
      company: "",
      streetAddress: "",
      addressLine2: "",
      city: "",
      province: "",
      postalCode: "",
      country: "Canada",
      phoneNumber: "",
      deliveryInstructions: "",
      addressType: addressType,
      isPrimary: false,
    },
  )

  const handleChange = (field: keyof Address, value: string | boolean) => {
    setAddress((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...address,
      id: address.id || `new-${Date.now()}`,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            value={address.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="company">Company (Optional)</Label>
          <Input
            id="company"
            value={address.company}
            onChange={(e) => handleChange("company", e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="streetAddress">Street Address</Label>
        <Input
          id="streetAddress"
          value={address.streetAddress}
          onChange={(e) => handleChange("streetAddress", e.target.value)}
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="addressLine2">Apartment, Suite, etc. (Optional)</Label>
        <Input
          id="addressLine2"
          value={address.addressLine2}
          onChange={(e) => handleChange("addressLine2", e.target.value)}
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={address.city}
            onChange={(e) => handleChange("city", e.target.value)}
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="province">Province</Label>
          <Input
            id="province"
            value={address.province}
            onChange={(e) => handleChange("province", e.target.value)}
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="postalCode">Postal Code</Label>
          <Input
            id="postalCode"
            value={address.postalCode}
            onChange={(e) => handleChange("postalCode", e.target.value)}
            required
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="country">Country</Label>
        <Input
          id="country"
          value={address.country}
          onChange={(e) => handleChange("country", e.target.value)}
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input
          id="phoneNumber"
          value={address.phoneNumber}
          onChange={(e) => handleChange("phoneNumber", e.target.value)}
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="deliveryInstructions">Delivery Instructions (Optional)</Label>
        <Textarea
          id="deliveryInstructions"
          value={address.deliveryInstructions}
          onChange={(e) => handleChange("deliveryInstructions", e.target.value)}
          placeholder="Add any special instructions for this address"
          className="mt-1"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isPrimary"
          checked={address.isPrimary}
          onCheckedChange={(checked) => handleChange("isPrimary", checked === true)}
        />
        <Label htmlFor="isPrimary">Save as primary address</Label>
      </div>

      <div className="flex justify-end">
        <Button type="submit">Save Address</Button>
      </div>
    </form>
  )
}

