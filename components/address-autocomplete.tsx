"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useScript } from "@/hooks/use-script"

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string, placeDetails?: google.maps.places.PlaceResult) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

// Declare the google variable
declare global {
  interface Window {
    google: any
    initGoogleMapsAutocomplete: () => void
  }
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

  // Load the Google Maps Places API script
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const scriptStatus = useScript(
      `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMapsAutocomplete`,
      { callbackName: "initGoogleMapsAutocomplete" },
  )

  // Initialize the autocomplete when the script is loaded
  useEffect(() => {
    if (scriptStatus !== "ready" || !inputRef.current) return

    setIsLoading(true)

    try {
      // Create Autocomplete instance
      const options = {
        fields: ["address_components", "formatted_address", "geometry", "name"],
        types: ["address"],
        componentRestrictions: { country: "ca" },
      }

      autocompleteRef.current = new window.google.maps.places.Autocomplete(
          inputRef.current,
          options,
      )

      // Listen for place changes
      autocompleteRef.current.addListener("place_changed", () => {
        if (!autocompleteRef.current) return

        const place = autocompleteRef.current.getPlace()
        console.log("Selected place:", place)

        // If the place lacks details, skip
        if (!place || !place.address_components) {
          console.log("No place details available")
          return
        }

        // Extract the final "street address" string
        const streetAddress = extractStreetAddress(place)

        // Tell parent about it
        onChange(streetAddress, place)
      })
    } catch (error) {
      console.error("Error initializing Google Places Autocomplete:", error)
    } finally {
      setIsLoading(false)
    }

    // Cleanup the event listeners on unmount
    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [scriptStatus, onChange])

  // Helper function to build a street address from place components
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

    // If we have a street number and route, combine them
    if (streetNumber && route) {
      return `${streetNumber} ${route}`
    }

    // Otherwise, use the first line of the formatted address as a fallback
    const formattedParts = place.formatted_address?.split(",") || []
    return formattedParts[0] || ""
  }

  // Handle typed input changes (user might clear the field, etc.)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const userValue = e.target.value
    // Clear place details if the user fully clears the input
    if (userValue === "") {
      onChange("", undefined)
    } else {
      onChange(userValue)
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
