"use client"

import { useMemo, useState } from "react"
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { Button } from "@/components/ui/button"

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

  const canCheck = useMemo(() => Boolean(selectedCoords) && !isChecking, [selectedCoords, isChecking])

  const handleAddressChange = (
    value: string,
    placeDetails?: google.maps.places.PlaceResult,
    changeSource: "selection" | "typing" = "typing",
  ) => {
    setAddressInput(value)
    setValidationMessage("")
    setAvailabilityState({ kind: "idle" })

    if (changeSource === "typing") {
      setSelectedCoords(null)
      return
    }

    const location = placeDetails?.geometry?.location
    if (!location) {
      setSelectedCoords(null)
      return
    }

    setSelectedCoords({ latitude: location.lat(), longitude: location.lng() })
  }

  const handleCheckAvailability = async () => {
    if (!selectedCoords) {
      setValidationMessage("Please choose an address from the suggestions before checking availability.")
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
      setAvailabilityState({ kind: "error", message: "We couldn’t check availability right now. Please try again." })
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <section id="availability" className="relative overflow-hidden py-20 bg-gradient-to-r from-primary/10 via-secondary/10 to-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.16),transparent_50%),radial-gradient(circle_at_80%_75%,hsl(var(--secondary)/0.14),transparent_45%)]" />
      <div className="container relative">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <p className="text-sm font-medium tracking-wide text-primary uppercase">Service Coverage</p>
          <h2 className="text-3xl md:text-4xl font-bold">Check Service Availability</h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Enter your address and we’ll instantly confirm if MapleX currently services your area.
          </p>
        </div>

        <div className="mt-10 max-w-4xl mx-auto rounded-3xl border border-white/40 bg-background/75 backdrop-blur-md p-4 md:p-5 shadow-lg">
          <div className="flex flex-col md:flex-row items-stretch gap-3 md:gap-4">
            <div className="flex-1 relative">
              <AddressAutocomplete
                value={addressInput}
                onChange={handleAddressChange}
                placeholder="Search your address"
                className="h-12 md:h-14 px-4 text-base bg-white/90"
              />
            </div>
            <Button
              onClick={handleCheckAvailability}
              disabled={!canCheck}
              className="h-12 md:h-14 px-6 md:px-8 text-base font-semibold md:min-w-[220px] bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
            >
              {isChecking ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Checking...
                </span>
              ) : (
                "Check Availability"
              )}
            </Button>
          </div>

          {validationMessage && (
            <div className="mt-5 rounded-lg border border-amber-300/70 bg-amber-50/95 px-4 py-3 text-sm text-amber-900 inline-flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{validationMessage}</span>
            </div>
          )}

          {availabilityState.kind === "success" && (
            <div
              className={`mt-5 rounded-lg border px-4 py-3 md:px-5 md:py-4 text-sm md:text-base inline-flex items-start gap-2 md:gap-3 ${
                availabilityState.serviceable
                  ? "border-emerald-300/80 bg-emerald-50/95 text-emerald-900"
                  : "border-orange-300/80 bg-orange-50/95 text-orange-900"
              }`}
            >
              {availabilityState.serviceable ? (
                <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 mt-0.5 shrink-0" />
              )}
              <p className="font-medium">
                {availabilityState.serviceable
                  ? `Yes, we currently service your area${availabilityState.city ? ` in ${availabilityState.city}` : ""}.`
                  : "Sorry, we do not currently service your area yet."}
              </p>
            </div>
          )}

          {availabilityState.kind === "error" && (
            <div className="mt-5 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive inline-flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{availabilityState.message}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
