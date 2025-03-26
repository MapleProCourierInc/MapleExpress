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

    // Define handleDocumentClick outside the try block so it's always available for cleanup
    const handleDocumentClick = (e: MouseEvent) => {
      // Check if the click is on a Google autocomplete suggestion
      const target = e.target as HTMLElement
      if (target.closest(".pac-container") || target.closest(".pac-item")) {
        // If it is, wait a bit for the place_changed event to fire
        setTimeout(() => {
          // If no place was selected (place_changed didn't fire), try to get the highlighted item
          if (autocompleteRef.current && inputRef.current) {
            const place = autocompleteRef.current.getPlace()
            if (!place || !place.address_components) {
              console.log("Trying to recover from click selection...")
              // This is a fallback in case the place_changed event doesn't fire properly
              // We can't directly get the highlighted item, but we can try to force a selection
              const input = inputRef.current
              const value = input.value
              if (value) {
                // Simulate an Enter key press
                const enterEvent = new KeyboardEvent("keydown", {
                  key: "Enter",
                  code: "Enter",
                  keyCode: 13,
                  which: 13,
                  bubbles: true,
                })
                input.dispatchEvent(enterEvent)
              }
            }
          }
        }, 300)
      }
    }

    // Add the document click listener
    document.addEventListener("click", handleDocumentClick)

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

        // Check if the place has details (to avoid issues with incomplete selection)
        if (!place || !place.address_components) {
          console.log("No place details available")
          return
        }

        // Extract just the street address part
        let streetAddress = ""

        // Get street number and street name
        const streetNumber =
            place.address_components.find((component) => component.types.includes("street_number"))?.long_name || ""

        const route = place.address_components.find((component) => component.types.includes("route"))?.long_name || ""

        if (streetNumber && route) {
          streetAddress = `${streetNumber} ${route}`
        } else {
          // Fallback to formatted_address if we can't extract street components
          streetAddress = place.formatted_address || ""
        }

        // Use setTimeout to ensure this runs after the click event is fully processed
        setTimeout(() => {
          onChange(streetAddress, place)
        }, 0)
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
      document.removeEventListener("click", handleDocumentClick)
    }
  }, [scriptStatus, onChange])

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
            className={`${className} border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary`}
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

