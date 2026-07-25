"use client"

import type React from "react"
import { useEffect, useId, useState } from "react"
import { Loader2, Save } from "lucide-react"

import { AddressAutocomplete } from "@/components/address-autocomplete"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { preventGooglePlacesDialogDismiss } from "@/lib/google-places-dialog"
import { updateProfileBillingAddress } from "@/lib/profile-service"
import { cn } from "@/lib/utils"
import type { ProfileBillingAddress } from "@/types/profile-billing-address"

interface BillingAddressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  address: ProfileBillingAddress | null
  defaultFullName?: string
  defaultPhoneNumber?: string
  onSaved: (address: ProfileBillingAddress) => void
}

function emptyBillingAddress(defaultFullName = "", defaultPhoneNumber = ""): ProfileBillingAddress {
  return {
    fullName: defaultFullName,
    company: "",
    streetAddress: "",
    addressLine2: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Canada",
    phoneNumber: defaultPhoneNumber,
    deliveryInstructions: "",
    addressType: "billing",
    isPrimary: true,
  }
}

function requiredFieldMessage(address: ProfileBillingAddress) {
  const requiredFields: Array<[keyof ProfileBillingAddress, string]> = [
    ["fullName", "Full name"],
    ["streetAddress", "Street address"],
    ["city", "City"],
    ["province", "Province or state"],
    ["postalCode", "Postal or ZIP code"],
    ["country", "Country"],
    ["phoneNumber", "Phone number"],
  ]

  const missingField = requiredFields.find(([field]) => {
    const value = address[field]
    return typeof value !== "string" || value.trim().length === 0
  })

  return missingField ? `${missingField[1]} is required.` : null
}

export function BillingAddressDialog({
  open,
  onOpenChange,
  address,
  defaultFullName,
  defaultPhoneNumber,
  onSaved,
}: BillingAddressDialogProps) {
  const { toast } = useToast()
  const id = useId()
  const [formData, setFormData] = useState<ProfileBillingAddress>(() =>
    address ? { ...address } : emptyBillingAddress(defaultFullName, defaultPhoneNumber),
  )
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setFormData(address ? { ...address } : emptyBillingAddress(defaultFullName, defaultPhoneNumber))
  }, [address, defaultFullName, defaultPhoneNumber, open])

  const updateField = (field: keyof ProfileBillingAddress, value: string) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleStreetAddressChange = (
    value: string,
    placeDetails?: google.maps.places.PlaceResult,
    changeSource?: "selection" | "typing",
  ) => {
    if (!placeDetails?.address_components || changeSource === "typing") {
      setFormData((current) => ({
        ...current,
        streetAddress: value,
        ...(changeSource === "typing" ? { coordinates: undefined } : {}),
      }))
      return
    }

    let city = ""
    let cityFallback = ""
    let province = ""
    let postalCode = ""
    let country = ""

    for (const component of placeDetails.address_components) {
      if (component.types.includes("locality")) {
        city = component.long_name
      } else if (
        component.types.includes("postal_town") ||
        component.types.includes("sublocality") ||
        component.types.includes("administrative_area_level_2")
      ) {
        cityFallback ||= component.long_name
      } else if (component.types.includes("administrative_area_level_1")) {
        province = component.short_name || component.long_name
      } else if (component.types.includes("postal_code")) {
        postalCode = component.long_name
      } else if (component.types.includes("country")) {
        country = component.long_name
      }
    }

    const location = placeDetails.geometry?.location

    setFormData((current) => ({
      ...current,
      streetAddress: value,
      city: city || cityFallback || current.city,
      province: province || current.province,
      postalCode: postalCode || current.postalCode,
      country: country || current.country,
      coordinates: location
        ? {
            latitude: location.lat(),
            longitude: location.lng(),
          }
        : current.coordinates,
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const validationMessage = requiredFieldMessage(formData)
    if (validationMessage) {
      toast({
        title: "Complete the billing address",
        description: validationMessage,
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const payload: ProfileBillingAddress = {
        ...formData,
        fullName: formData.fullName.trim(),
        company: formData.company?.trim() || "",
        streetAddress: formData.streetAddress.trim(),
        addressLine2: formData.addressLine2?.trim() || "",
        city: formData.city.trim(),
        province: formData.province.trim(),
        postalCode: formData.postalCode.trim().toUpperCase(),
        country: formData.country.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        deliveryInstructions: formData.deliveryInstructions?.trim() || "",
        addressType: "billing",
        isPrimary: true,
      }
      const updatedAddress = await updateProfileBillingAddress(payload)
      onSaved({ ...payload, ...updatedAddress })
      onOpenChange(false)
      toast({
        title: "Billing address saved",
        description: "Your billing address is ready for invoices and payment checkout.",
      })
    } catch (error) {
      toast({
        title: "Billing address was not saved",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const fieldId = (field: string) => `${id}-${field}`

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSaving && onOpenChange(nextOpen)}>
      <DialogContent
        className="max-h-[92vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto"
        onInteractOutside={preventGooglePlacesDialogDismiss}
        onPointerDownOutside={preventGooglePlacesDialogDismiss}
      >
        <DialogHeader>
          <DialogTitle>{address ? "Update billing address" : "Add billing address"}</DialogTitle>
          <DialogDescription>
            This address is used for payment verification, invoices, and tax records. It does not change your saved
            pickup or delivery addresses.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={fieldId("full-name")}>Full Name</Label>
              <Input
                id={fieldId("full-name")}
                value={formData.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                disabled={isSaving}
                autoComplete="name"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={fieldId("company")}>Company (Optional)</Label>
              <Input
                id={fieldId("company")}
                value={formData.company || ""}
                onChange={(event) => updateField("company", event.target.value)}
                disabled={isSaving}
                autoComplete="organization"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={fieldId("street-address")}>Street Address</Label>
            <AddressAutocomplete
              id={fieldId("street-address")}
              value={formData.streetAddress}
              onChange={handleStreetAddressChange}
              placeholder="Start typing a street address"
              disabled={isSaving}
              className="mt-0"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={fieldId("address-line-2")}>Apartment, Suite, or Unit (Optional)</Label>
            <Input
              id={fieldId("address-line-2")}
              value={formData.addressLine2 || ""}
              onChange={(event) => updateField("addressLine2", event.target.value)}
              disabled={isSaving}
              autoComplete="address-line2"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={fieldId("city")}>City</Label>
              <Input
                id={fieldId("city")}
                value={formData.city}
                onChange={(event) => updateField("city", event.target.value)}
                disabled={isSaving}
                autoComplete="address-level2"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={fieldId("province")}>Province or State</Label>
              <Input
                id={fieldId("province")}
                value={formData.province}
                onChange={(event) => updateField("province", event.target.value)}
                disabled={isSaving}
                autoComplete="address-level1"
                placeholder="NB"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={fieldId("postal-code")}>Postal or ZIP Code</Label>
              <Input
                id={fieldId("postal-code")}
                value={formData.postalCode}
                onChange={(event) => updateField("postalCode", event.target.value)}
                disabled={isSaving}
                autoComplete="postal-code"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={fieldId("country")}>Country</Label>
              <Input
                id={fieldId("country")}
                value={formData.country}
                onChange={(event) => updateField("country", event.target.value)}
                disabled={isSaving}
                autoComplete="country-name"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={fieldId("phone-number")}>Phone Number</Label>
            <Input
              id={fieldId("phone-number")}
              type="tel"
              value={formData.phoneNumber}
              onChange={(event) => updateField("phoneNumber", event.target.value)}
              disabled={isSaving}
              autoComplete="tel"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? "Saving..." : "Save Billing Address"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function BillingAddressSummary({
  address,
  className,
}: {
  address: ProfileBillingAddress
  className?: string
}) {
  const locality = [address.city, address.province].filter(Boolean).join(", ")

  return (
    <address className={cn("space-y-0.5 break-words text-sm not-italic leading-5 text-slate-700", className)}>
      <p className="font-semibold text-slate-950">{address.fullName}</p>
      {address.company ? <p>{address.company}</p> : null}
      <p>
        {address.streetAddress}
        {address.addressLine2 ? `, ${address.addressLine2}` : ""}
      </p>
      <p>{[locality, address.postalCode].filter(Boolean).join(" ")}</p>
      <p>{address.country}</p>
      <p>{address.phoneNumber}</p>
    </address>
  )
}
