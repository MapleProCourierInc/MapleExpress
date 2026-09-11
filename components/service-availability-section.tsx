"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { AlertCircle, CheckCircle2, Loader2, MapPin, XCircle } from "lucide-react"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { Button } from "@/components/ui/button"

type AvailabilityState =
  | { kind: "idle" }
  | { kind: "success"; serviceable: boolean }
  | { kind: "error"; message: string }

const STANDARD_SERVICE_CITIES = ["Moncton", "Dieppe", "Riverview"]

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

      const payload = (await response.json()) as { serviceable: boolean }

      setAvailabilityState({
        kind: "success",
        serviceable: payload.serviceable,
      })
    } catch {
      setAvailabilityState({ kind: "error", message: "We couldn't check availability right now. Please try again." })
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <section
      id="availability"
      className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-secondary/10 to-background py-20"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.16),transparent_50%),radial-gradient(circle_at_80%_75%,hsl(var(--secondary)/0.14),transparent_45%)]" />
      <div className="container relative">
        <div className="text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Check Service Availability</h2>
        </div>

        <div className="mx-auto mt-8 max-w-6xl overflow-hidden rounded-[2rem] border border-white/60 bg-background/85 shadow-[0_24px_70px_-32px_hsl(var(--brand-rust)/0.45)] backdrop-blur-md">
          <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
            <div className="border-b bg-gradient-to-br from-brand-forest-soft/80 via-background/75 to-brand-maple-soft/70 p-6 md:p-8 lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-forest text-white shadow-sm">
                  <MapPin className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-forest">Core Service Area</p>
              </div>
              <h3 className="mt-5 text-2xl font-bold">Greater Moncton, covered.</h3>
              <p className="mt-2 max-w-md leading-6 text-muted-foreground">
                Same-day pickup and delivery are available across our three primary service communities.
              </p>
              <ul className="mt-5 flex flex-wrap gap-2 text-sm font-semibold">
                {STANDARD_SERVICE_CITIES.map((city) => (
                  <li
                    key={city}
                    className="inline-flex items-center gap-2 rounded-full border border-brand-forest/15 bg-background/80 px-3.5 py-2 shadow-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 text-brand-forest" />
                    {city}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col justify-center p-6 md:p-8">
              <h3 className="text-2xl font-bold">Is this address in our service area?</h3>

              <div className="mt-5 flex flex-col items-stretch gap-3 md:flex-row">
                <div className="relative flex-1">
                  <AddressAutocomplete
                    value={addressInput}
                    onChange={handleAddressChange}
                    placeholder="Search your address"
                    className="h-12 bg-background px-4 text-base md:h-14"
                  />
                </div>
                <Button
                  onClick={handleCheckAvailability}
                  disabled={!canCheck}
                  className="h-12 bg-gradient-to-r from-primary to-primary/90 px-6 text-base font-semibold shadow-sm hover:from-primary/90 hover:to-primary md:h-14 md:min-w-[200px]"
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

              {validationMessage ? (
                <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-300/70 bg-amber-50/95 px-4 py-3 text-sm text-amber-900">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{validationMessage}</span>
                </div>
              ) : null}

              {availabilityState.kind === "success" ? (
                <div
                  className={`mt-5 rounded-2xl border px-4 py-4 md:px-5 ${
                    availabilityState.serviceable
                      ? "border-brand-forest/25 bg-brand-forest-soft/70"
                      : "border-brand-maple/35 bg-brand-maple-soft/75"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        availabilityState.serviceable
                          ? "bg-brand-forest text-white"
                          : "bg-brand-rust text-white"
                      }`}
                    >
                      {availabilityState.serviceable ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-lg font-semibold text-foreground">
                        {availabilityState.serviceable ? "Great News!" : "Outside Our Standard Service Area"}
                      </p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {availabilityState.serviceable
                          ? "Same-day pickup and delivery are available for this address."
                          : "Same-day pickup and delivery are not currently available for this address."}
                      </p>
                      {!availabilityState.serviceable ? (
                        <p className="text-sm text-muted-foreground">
                          <Link
                            href="#get-in-touch"
                            className="font-semibold text-primary underline-offset-4 hover:underline"
                          >
                            Get in touch
                          </Link>{" "}
                          to ask about delivery outside our standard area.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {availabilityState.kind === "error" ? (
                <div className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-4 md:px-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <p className="pt-1 font-medium text-foreground">{availabilityState.message}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t bg-brand-maple-soft/55 px-6 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8 lg:px-10">
            <p className="text-sm leading-6 text-muted-foreground">
              <span className="font-semibold text-foreground">Need delivery outside our standard service area?</span>{" "}
              Tell us where it needs to go and we will review the request.
            </p>
            <Link
              href="#get-in-touch"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Contact us for a custom quote
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
