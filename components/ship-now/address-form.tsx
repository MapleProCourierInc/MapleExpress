"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Address } from "@/components/ship-now/ship-now-form"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { checkAddressServiceability } from "@/lib/serviceability-service"

interface AddressFormProps {
    onSubmit: (address: Address, saveForFuture: boolean) => void
    addressType: string
    initialAddress: Address | null
    showSaveOption?: boolean
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

export function AddressForm({ onSubmit, addressType, initialAddress, showSaveOption = true }: AddressFormProps) {
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
    const [saveForFuture, setSaveForFuture] = useState(false)
    const [serviceabilityState, setServiceabilityState] = useState<"unknown" | "checking" | "serviceable" | "non-serviceable" | "error">("unknown")
    const [serviceabilityMessage, setServiceabilityMessage] = useState<string | null>(null)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const requestIdRef = useRef(0)

    const handleChange = (field: keyof Address, value: string | boolean) => {
        setAddress((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const resetServiceability = () => {
        setServiceabilityState("unknown")
        setServiceabilityMessage(null)
    }

    const runServiceabilityCheck = async (latitude: number, longitude: number) => {
        const requestId = ++requestIdRef.current
        setServiceabilityState("checking")
        setServiceabilityMessage("Checking MapleX serviceability...")

        try {
            const result = await checkAddressServiceability(latitude, longitude)
            if (requestId !== requestIdRef.current) return

            if (result.serviceable) {
                setServiceabilityState("serviceable")
                setServiceabilityMessage(result.message || "This address is within MapleX serviceable area.")
                return
            }

            setServiceabilityState("non-serviceable")
            setServiceabilityMessage(result.message || "Location is outside MapleX serviceable area.")
        } catch (error) {
            if (requestId !== requestIdRef.current) return
            setServiceabilityState("error")
            setServiceabilityMessage(error instanceof Error ? error.message : "Unable to validate this address right now. Please try again.")
        }
    }

    const processAddressComponents = (placeDetails: any) => {
        if (!placeDetails || !placeDetails.address_components) return

        let city = ""
        let province = ""
        let postalCode = ""
        let country = ""

        for (const component of placeDetails.address_components) {
            const types = component.types

            if (types.includes("locality") || types.includes("sublocality")) {
                city = component.long_name
            } else if (types.includes("administrative_area_level_1")) {
                const provinceMatch = PROVINCES.find(
                    (p) => p.label.toLowerCase() === component.long_name.toLowerCase() || p.value.toLowerCase() === component.short_name.toLowerCase(),
                )
                province = provinceMatch ? provinceMatch.value : component.short_name
            } else if (types.includes("postal_code")) {
                postalCode = component.long_name
            } else if (types.includes("country")) {
                country = component.long_name
            }
        }

        const coordinates = placeDetails.geometry?.location
            ? {
                latitude: placeDetails.geometry.location.lat(),
                longitude: placeDetails.geometry.location.lng(),
            }
            : undefined

        setAddress((prev) => ({
            ...prev,
            city: city || prev.city,
            province: province || prev.province,
            postalCode: postalCode || prev.postalCode,
            country: country || prev.country,
            coordinates,
        }))

        if (coordinates) {
            runServiceabilityCheck(coordinates.latitude, coordinates.longitude)
        } else {
            resetServiceability()
        }
    }

    const handleAddressChange = (value: string, placeDetails?: any, changeSource?: "selection" | "typing") => {
        handleChange("streetAddress", value)
        setSubmitError(null)

        if (changeSource === "typing") {
            setAddress((prev) => ({
                ...prev,
                coordinates: undefined,
            }))
            resetServiceability()
            return
        }

        if (placeDetails) {
            processAddressComponents(placeDetails)
        }
    }

    useEffect(() => {
        if (!address.coordinates) return
        runServiceabilityCheck(address.coordinates.latitude, address.coordinates.longitude)
    }, [])

    const canSaveForFuture = serviceabilityState === "serviceable"

    useEffect(() => {
        if (!canSaveForFuture) {
            setSaveForFuture(false)
        }
    }, [canSaveForFuture])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (serviceabilityState !== "serviceable") {
            setSubmitError("Please select a serviceable address from autocomplete before continuing.")
            return
        }

        onSubmit(
            {
                ...address,
                id: address.id || `new-${Date.now()}`,
                addressType: addressType,
            },
            saveForFuture,
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" value={address.fullName} onChange={(e) => handleChange("fullName", e.target.value)} required className="mt-1" />
                </div>

                <div>
                    <Label htmlFor="company">Company (Optional)</Label>
                    <Input id="company" value={address.company} onChange={(e) => handleChange("company", e.target.value)} className="mt-1" />
                </div>
            </div>

            <div>
                <Label htmlFor="streetAddress">Street Address</Label>
                <AddressAutocomplete value={address.streetAddress} onChange={handleAddressChange} placeholder="Enter street address" required className="mt-1" />
                {serviceabilityState === "checking" && <p className="mt-2 text-sm text-muted-foreground">{serviceabilityMessage}</p>}
                {serviceabilityState === "serviceable" && <p className="mt-2 text-sm text-green-600">{serviceabilityMessage}</p>}
                {(serviceabilityState === "non-serviceable" || serviceabilityState === "error") && (
                    <p className="mt-2 text-sm text-red-600">{serviceabilityMessage}</p>
                )}
            </div>

            <div>
                <Label htmlFor="addressLine2">Apartment, Suite, etc. (Optional)</Label>
                <Input id="addressLine2" value={address.addressLine2} onChange={(e) => handleChange("addressLine2", e.target.value)} className="mt-1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={address.city} onChange={(e) => handleChange("city", e.target.value)} required className="mt-1" />
                </div>

                <div>
                    <Label htmlFor="province">Province</Label>
                    <Select value={address.province} onValueChange={(value) => handleChange("province", value)}>
                        <SelectTrigger id="province" className="mt-1">
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

                <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input id="postalCode" value={address.postalCode} onChange={(e) => handleChange("postalCode", e.target.value)} required className="mt-1" />
                </div>
            </div>

            <div>
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={address.country} onChange={(e) => handleChange("country", e.target.value)} required className="mt-1" />
            </div>

            <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input id="phoneNumber" value={address.phoneNumber} onChange={(e) => handleChange("phoneNumber", e.target.value)} required className="mt-1" />
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

            {showSaveOption && (
                <div className="flex items-center space-x-2">
                    <Checkbox id="saveForFuture" checked={saveForFuture} disabled={!canSaveForFuture} onCheckedChange={(checked) => setSaveForFuture(checked === true)} />
                    <Label htmlFor="saveForFuture">Save this address for future use</Label>
                </div>
            )}

            {showSaveOption && !canSaveForFuture && <p className="text-sm text-muted-foreground">Only serviceable addresses can be saved for future use.</p>}
            {submitError && <p className="text-sm text-red-600">{submitError}</p>}

            <div className="flex justify-end">
                <Button type="submit" disabled={serviceabilityState === "checking"}>Continue</Button>
            </div>
        </form>
    )
}
