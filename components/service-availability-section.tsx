"use client"

import { useMemo, useState } from "react"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type AvailabilityState =
  | { kind: "idle" }
  | { kind: "success"; serviceable: boolean; city?: string; matchedZoneName?: string; station?: string }
  | { kind: "error"; message: string }

export function ServiceAvailabilitySection() {
  const [addressInput, setAddressInput] = useState("")
  const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [validationMessage, setValidationMessage] = useState("")
  const [availabilityState, setAvailabilityState] = useState<AvailabilityState>({ kind: "idle" })

  const canCheck = useMemo(() => Boolean(selectedCoords && !isChecking), [selectedCoords, isChecking])

  const handleAddressChange = (value: string, placeDetails?: google.maps.places.PlaceResult) => {
    setAddressInput(value)
    setValidationMessage("")
    setAvailabilityState({ kind: "idle" })

    const location = placeDetails?.geometry?.location
    if (!location) {
      setSelectedCoords(null)
      return
    }

    setSelectedCoords({
      latitude: location.lat(),
      longitude: location.lng(),
    })
  }

  const handleCheckAvailability = async () => {
    if (!selectedCoords) {
      setValidationMessage("Please select a valid address from the suggestions before checking.")
      return
    }

    setValidationMessage("")
    setIsChecking(true)

    try {
      const response = await fetch("/api/public/serviceability", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedCoords),
      })

      if (!response.ok) {
        throw new Error("Serviceability request failed")
      }

      const payload = (await response.json()) as {
        serviceable: boolean
        city?: string
        matchedZoneName?: string
        station?: string
      }

      setAvailabilityState({
        kind: "success",
        serviceable: payload.serviceable,
        city: payload.city,
        matchedZoneName: payload.matchedZoneName,
        station: payload.station,
      })
    } catch {
      setAvailabilityState({
        kind: "error",
        message: "We couldn’t check availability right now. Please try again in a moment.",
      })
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <section id="availability" className="py-20">
      <div className="container">
        <Card className="border-none shadow-md bg-gradient-to-r from-secondary/10 to-primary/10">
          <CardContent className="pt-8 pb-8 px-6 md:px-10">
            <div className="max-w-[760px] mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Check Service Availability</h2>
              <p className="text-muted-foreground mb-8">
                Enter your address to quickly see whether MapleX currently services your area.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <AddressAutocomplete
                  value={addressInput}
                  onChange={handleAddressChange}
                  placeholder="Search your address"
                  className="flex-1"
                />
                <Button onClick={handleCheckAvailability} disabled={!canCheck} className="sm:min-w-52">
                  {isChecking ? "Checking..." : "Check Availability"}
                </Button>
              </div>

              {validationMessage && <p className="text-sm text-destructive mt-4">{validationMessage}</p>}

              {availabilityState.kind === "success" && (
                <p
                  className={`mt-6 text-sm md:text-base font-medium ${
                    availabilityState.serviceable ? "text-green-700" : "text-amber-700"
                  }`}
                >
                  {availabilityState.serviceable
                    ? `Yes, we service your area${availabilityState.city ? ` in ${availabilityState.city}` : ""}.`
                    : "Sorry, we do not currently service your area."}
                </p>
              )}

              {availabilityState.kind === "error" && (
                <p className="text-sm text-destructive mt-6">{availabilityState.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
