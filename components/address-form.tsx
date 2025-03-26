"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Address } from "@/types/address"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { AddressAutocomplete } from "@/components/address-autocomplete"

interface AddressFormProps {
  address?: Address
  onSubmit: (addressData: Omit<Address, "addressId">) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

const PROVINCES = [
  { value: "AB", label: "Alberta" },
  { value: "BC", label: "British Columbia" },
  { value: "MB", label: "Manitoba" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland and Labrador" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NT", label: "Northwest Territories" },
  { value: "NU", label: "Nunavut" },
  { value: "ON", label: "Ontario" },
  { value: "PE", label: "Prince Edward Island" },
  { value: "QC", label: "Quebec" },
  { value: "SK", label: "Saskatchewan" },
  { value: "YT", label: "Yukon" },
]

const ADDRESS_TYPES = [
  { value: "home", label: "Home" },
  { value: "work", label: "Work" },
  { value: "shipping", label: "Shipping" },
  { value: "billing", label: "Billing" },
  { value: "other", label: "Other" },
]

const COUNTRIES = [
  { value: "Canada", label: "Canada" },
  { value: "USA", label: "United States" },
]

declare global {
  interface Window {
    google: any
  }
}

export function AddressForm({ address, onSubmit, onCancel, isSubmitting }: AddressFormProps) {
  const [isBusinessAddress, setIsBusinessAddress] = useState(!!address?.company)
  const [formData, setFormData] = useState<Omit<Address, "addressId">>({
    fullName: address?.fullName || "",
    company: address?.company || "",
    streetAddress: address?.streetAddress || "",
    addressLine2: address?.addressLine2 || "",
    city: address?.city || "",
    province: address?.province || "",
    postalCode: address?.postalCode || "",
    country: address?.country || "Canada",
    phoneNumber: address?.phoneNumber || "",
    deliveryInstructions: address?.deliveryInstructions || "",
    addressType: address?.addressType || "home",
    isPrimary: false,
    coordinates: address?.coordinates || undefined,
  })

  useEffect(() => {
    if (address) {
      setFormData({
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
        addressType: address.addressType,
        isPrimary: address.isPrimary,
        coordinates: address.coordinates,
      })
      setIsBusinessAddress(!!address.company)
    }
  }, [address])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleBusinessToggle = (checked: boolean) => {
    setIsBusinessAddress(checked)
    if (!checked) {
      setFormData((prev) => ({ ...prev, company: "" }))
    }
  }

  const handleAddressChange = (value: string, placeDetails?: any) => {
    console.log("Address changed:", value)
    console.log("Place details:", placeDetails)

    // Set only the street address in the street address field
    setFormData((prev) => ({ ...prev, streetAddress: value }))

    if (placeDetails && placeDetails.address_components) {
      // Extract address components
      let city = ""
      let province = ""
      let postalCode = ""
      let country = ""

      for (const component of placeDetails.address_components) {
        const types = component.types

        if (types.includes("locality") || types.includes("sublocality")) {
          city = component.long_name
        } else if (types.includes("administrative_area_level_1")) {
          // Convert full province name to code if needed
          const provinceCode = PROVINCES.find((p) => p.label.toLowerCase() === component.long_name.toLowerCase())?.value
          province = provinceCode || component.short_name
        } else if (types.includes("postal_code")) {
          postalCode = component.long_name
        } else if (types.includes("country")) {
          country = component.long_name
        }
      }

      // Update form data with extracted components
      setFormData((prev) => ({
        ...prev,
        city: city || prev.city,
        province: province || prev.province,
        postalCode: postalCode || prev.postalCode,
        country: country || prev.country,
        coordinates: placeDetails.geometry?.location
          ? {
              latitude: placeDetails.geometry.location.lat(),
              longitude: placeDetails.geometry.location.lng(),
            }
          : prev.coordinates,
      }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch id="business-address" checked={isBusinessAddress} onCheckedChange={handleBusinessToggle} />
        <Label htmlFor="business-address">This is a business address</Label>
      </div>

      <div className="space-y-1">
        <Label htmlFor="fullName">{isBusinessAddress ? "Point of Contact" : "Full Name"}</Label>
        <Input
          id="fullName"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Enter full name"
          required
        />
      </div>

      {isBusinessAddress && (
        <div className="space-y-1">
          <Label htmlFor="company">Business Name</Label>
          <Input
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="Enter business name"
            required={isBusinessAddress}
          />
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="streetAddress">Street Address</Label>
        <AddressAutocomplete
          value={formData.streetAddress}
          onChange={handleAddressChange}
          placeholder="Enter street address"
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="addressLine2">Apartment, Suite, etc. (optional)</Label>
        <Input
          id="addressLine2"
          name="addressLine2"
          value={formData.addressLine2}
          onChange={handleChange}
          placeholder="Apartment, suite, unit, building, floor, etc."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Enter city"
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="province">Province</Label>
          <Select value={formData.province} onValueChange={(value) => handleSelectChange("province", value)} required>
            <SelectTrigger id="province">
              <SelectValue placeholder="Select province" />
            </SelectTrigger>
            <SelectContent>
              {PROVINCES.map((province) => (
                <SelectItem key={province.value} value={province.value}>
                  {province.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="postalCode">Postal Code</Label>
          <Input
            id="postalCode"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            placeholder="Enter postal code"
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="country">Country</Label>
          <Select value={formData.country} onValueChange={(value) => handleSelectChange("country", value)} required>
            <SelectTrigger id="country">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.value} value={country.value}>
                  {country.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input
          id="phoneNumber"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          placeholder="Enter phone number"
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="addressType">Address Type</Label>
        <Select
          value={formData.addressType}
          onValueChange={(value) => handleSelectChange("addressType", value)}
          required
        >
          <SelectTrigger id="addressType">
            <SelectValue placeholder="Select address type" />
          </SelectTrigger>
          <SelectContent>
            {ADDRESS_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="deliveryInstructions">Delivery Instructions (optional)</Label>
        <Textarea
          id="deliveryInstructions"
          name="deliveryInstructions"
          value={formData.deliveryInstructions}
          onChange={handleChange}
          placeholder="Special instructions for delivery"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {address ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>{address ? "Update Address" : "Add Address"}</>
          )}
        </Button>
      </div>
    </form>
  )
}

