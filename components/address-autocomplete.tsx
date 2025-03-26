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
  const status = useScript(
    `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=Function.prototype`,
  )

  // Initialize the autocomplete when the script is loaded
  useEffect(() => {
    if (status !== "ready" || !inputRef.current) return

    setIsLoading(true)
    try {
      // Create the autocomplete instance
      const options = {
        fields: ["address_components", "formatted_address", "geometry", "name"],
        types: ["address"],
      }

      // Create the autocomplete instance
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, options)

      // Add a listener for place changes
      autocompleteRef.current.addListener("place_changed", () => {
        if (!autocompleteRef.current) return

        const place = autocompleteRef.current.getPlace()
        console.log("Selected place:", place)

        if (place) {
          // Extract just the street address part
          let streetAddress = ""

          if (place.address_components) {
            // Get street number and street name
            const streetNumber =
              place.address_components.find((component) => component.types.includes("street_number"))?.long_name || ""

            const route =
              place.address_components.find((component) => component.types.includes("route"))?.long_name || ""

            if (streetNumber && route) {
              streetAddress = `${streetNumber} ${route}`
            } else {
              // Fallback to formatted_address if we can't extract street components
              streetAddress = place.formatted_address || ""
            }
          } else {
            streetAddress = place.formatted_address || ""
          }

          onChange(streetAddress, place)
        }
      })
    } catch (error) {
      console.error("Error initializing Google Places Autocomplete:", error)
    } finally {
      setIsLoading(false)
    }

    // Clean up
    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [status, onChange])

  // Handle manual input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
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
        className={className}
        // Remove inline styles and use className instead
        autoComplete="off" // This helps with some browsers
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

