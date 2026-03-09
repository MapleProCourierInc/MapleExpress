"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useScript } from "@/hooks/use-script"
import { GOOGLE_MAPS_API_KEY } from "@/lib/config"

interface AddressAutocompleteProps {
  value: string
  onChange: (
    value: string,
    placeDetails?: google.maps.places.PlaceResult,
    changeSource?: "selection" | "typing",
  ) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

declare global {
  interface Window {
    google: any
    initGoogleMapsAutocomplete: () => void
  }
}

function fetchFullPlaceDetails(placeId: string): Promise<google.maps.places.PlaceResult | null> {
  return new Promise((resolve) => {
    const googleMaps = window.google?.maps
    if (!googleMaps?.places?.PlacesService) {
      resolve(null)
      return
    }

    const container = document.createElement("div")
    const placesService = new googleMaps.places.PlacesService(container)

    placesService.getDetails(
      {
        placeId,
        fields: ["address_components", "formatted_address", "geometry", "name", "place_id"],
      },
      (result: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
        if (status === googleMaps.places.PlacesServiceStatus.OK && result) {
          resolve(result)
          return
        }
        resolve(null)
      },
    )
  })
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Enter an address",
  required = false,
  disabled = false,
  className = "",
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const scriptStatus = useScript(
    `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMapsAutocomplete`,
    { callbackName: "initGoogleMapsAutocomplete" },
  )

  useEffect(() => {
    if (scriptStatus !== "ready" || !inputRef.current) return
    if (autocompleteRef.current) return

    setIsLoading(true)

    try {
      const options = {
        fields: ["address_components", "formatted_address", "geometry", "name", "place_id"],
        types: ["address"],
        componentRestrictions: { country: "ca" },
      }

      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, options)

      autocompleteRef.current.addListener("place_changed", async () => {
        if (!autocompleteRef.current) return

        const selectedPlace = autocompleteRef.current.getPlace()
        if (!selectedPlace?.geometry?.location) return

        let placeDetails = selectedPlace

        if ((!placeDetails.address_components || placeDetails.address_components.length === 0) && placeDetails.place_id) {
          const enrichedDetails = await fetchFullPlaceDetails(placeDetails.place_id)
          if (enrichedDetails?.geometry?.location) {
            placeDetails = enrichedDetails
          }
        }

        const streetAddress = extractStreetAddress(placeDetails)
        onChangeRef.current(streetAddress, placeDetails, "selection")
      })
    } catch (error) {
      console.error("Error initializing Google Places Autocomplete:", error)
    } finally {
      setIsLoading(false)
    }

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
        autocompleteRef.current = null
      }
    }
  }, [scriptStatus])

  const extractStreetAddress = (place: google.maps.places.PlaceResult): string => {
    let streetNumber = ""
    let route = ""

    if (place.address_components) {
      for (const component of place.address_components) {
        const types = component.types
        if (types.includes("street_number")) {
          streetNumber = component.long_name
        } else if (types.includes("route")) {
          route = component.long_name
        }
      }
    }

    if (streetNumber && route) {
      return `${streetNumber} ${route}`
    }

    const formattedParts = place.formatted_address?.split(",") || []
    return formattedParts[0] || ""
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const userValue = e.target.value
    if (userValue === "") {
      onChangeRef.current("", undefined, "typing")
    } else {
      onChangeRef.current(userValue, undefined, "typing")
    }
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`${className} border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary`}
        autoComplete="off"
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
