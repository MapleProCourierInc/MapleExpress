"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  PackageCheck,
  Ruler,
  Scale,
  Sparkles,
  Truck,
} from "lucide-react"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { LoginModal } from "@/components/login-modal"
import { SignupModal } from "@/components/signup-modal"
import { VerificationPending } from "@/components/verification-pending"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import type {
  PublicRateAddress,
  PublicRateErrorResponse,
  PublicRateEstimateResponse,
  PublicRateOption,
} from "@/types/public-rates"

type CoverageStatus = "idle" | "checking" | "serviceable" | "unserviceable" | "error"
type AddressKind = "pickup" | "delivery"

type AddressFieldState = {
  value: string
  address: PublicRateAddress | null
  coverage: CoverageStatus
}

type ParcelField = "length" | "width" | "height" | "weight"

const EMPTY_ADDRESS: AddressFieldState = {
  value: "",
  address: null,
  coverage: "idle",
}

const STEPS = ["Route", "Parcel", "Rates"]

function addressPart(place: google.maps.places.PlaceResult, types: string[], useShortName = false) {
  const component = place.address_components?.find((item) => types.some((type) => item.types.includes(type)))
  return component ? (useShortName ? component.short_name : component.long_name) : ""
}

function toRateAddress(place: google.maps.places.PlaceResult): PublicRateAddress | null {
  const streetNumber = addressPart(place, ["street_number"])
  const route = addressPart(place, ["route"])
  const streetAddress = [streetNumber, route].filter(Boolean).join(" ") || place.formatted_address?.split(",")[0]?.trim() || ""
  const city = addressPart(place, ["locality", "postal_town", "sublocality", "administrative_area_level_2"])
  const province = addressPart(place, ["administrative_area_level_1"], true)
  const postalCode = addressPart(place, ["postal_code"])
  const country = addressPart(place, ["country"], true) || "CA"

  if (!streetAddress || !city || !province || !postalCode || !country) return null
  return { streetAddress, city, province, postalCode, country }
}

function getErrorMessage(payload: PublicRateErrorResponse | null, fallback: string) {
  return payload?.detail || payload?.message || payload?.title || fallback
}

function chargeValue(charges: Record<string, number> | undefined, label: string) {
  if (!charges) return undefined
  const key = Object.keys(charges).find((item) => item.trim().toLowerCase() === label.toLowerCase())
  const value = key ? charges[key] : undefined
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function priceSummary(option: PublicRateOption) {
  const charges = option.pricing?.charges
  const subtotal = chargeValue(charges, "Subtotal")
  const total = chargeValue(charges, "Total")
  const namedTax = Object.entries(charges || {}).reduce((sum, [name, value]) => {
    return /(^|\s)(tax|hst|gst|pst|qst)(\s|$)/i.test(name) && Number.isFinite(value) ? sum + value : sum
  }, 0)
  const tax = subtotal !== undefined && total !== undefined ? Math.max(0, total - subtotal) : namedTax

  return { subtotal, tax, total }
}

function formatMoney(amount: number | undefined, currency = "CAD") {
  if (amount === undefined) return "—"
  return new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(amount)
}

function AddressStatus({ status }: { status: CoverageStatus }) {
  if (status === "idle") {
    return null
  }
  if (status === "checking") {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking service availability…
      </p>
    )
  }
  if (status === "serviceable") {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-brand-forest">
        <CheckCircle2 className="h-3.5 w-3.5" /> This address is in our service area.
      </p>
    )
  }
  if (status === "unserviceable") {
    return <p className="mt-2 text-xs font-semibold text-primary">Outside our standard online service area.</p>
  }
  return <p className="mt-2 text-xs font-semibold text-primary">We could not verify this address. Please select it again.</p>
}

export function RateEstimator() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [step, setStep] = useState(1)
  const [pickup, setPickup] = useState<AddressFieldState>(EMPTY_ADDRESS)
  const [delivery, setDelivery] = useState<AddressFieldState>(EMPTY_ADDRESS)
  const [parcel, setParcel] = useState<Record<ParcelField, string>>({ length: "", width: "", height: "", weight: "" })
  const [estimate, setEstimate] = useState<PublicRateEstimateResponse | null>(null)
  const [estimateError, setEstimateError] = useState("")
  const [isEstimating, setIsEstimating] = useState(false)
  const [outOfAreaKind, setOutOfAreaKind] = useState<AddressKind | null>(null)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isSignupOpen, setIsSignupOpen] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState("")
  const [shipAfterLogin, setShipAfterLogin] = useState(false)
  const requestIds = useRef<Record<AddressKind, number>>({ pickup: 0, delivery: 0 })

  useEffect(() => {
    if (!shipAfterLogin || !user) return
    setShipAfterLogin(false)
    setIsLoginOpen(false)
    router.push("/ship-now")
  }, [router, shipAfterLogin, user])

  const updateAddress = (kind: AddressKind, next: AddressFieldState) => {
    if (kind === "pickup") setPickup(next)
    else setDelivery(next)
    setEstimate(null)
    setEstimateError("")
  }

  const handleAddressChange = async (
    kind: AddressKind,
    value: string,
    place?: google.maps.places.PlaceResult,
    source?: "selection" | "typing",
  ) => {
    if (source !== "selection" || !place?.geometry?.location) {
      requestIds.current[kind] += 1
      updateAddress(kind, { value, address: null, coverage: "idle" })
      return
    }

    const address = toRateAddress(place)
    const displayValue = place.formatted_address || value
    if (!address) {
      updateAddress(kind, { value: displayValue, address: null, coverage: "error" })
      return
    }

    const requestId = ++requestIds.current[kind]
    updateAddress(kind, { value: displayValue, address, coverage: "checking" })

    try {
      const response = await fetch("/api/public/serviceability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
        }),
      })
      const data = (await response.json().catch(() => null)) as { serviceable?: boolean } | null
      if (requestId !== requestIds.current[kind]) return

      if (!response.ok || typeof data?.serviceable !== "boolean") {
        updateAddress(kind, { value: displayValue, address, coverage: "error" })
        return
      }

      const coverage = data.serviceable ? "serviceable" : "unserviceable"
      updateAddress(kind, { value: displayValue, address, coverage })
      if (!data.serviceable) setOutOfAreaKind(kind)
    } catch {
      if (requestId === requestIds.current[kind]) {
        updateAddress(kind, { value: displayValue, address, coverage: "error" })
      }
    }
  }

  const setParcelField = (field: ParcelField, value: string) => {
    setParcel((current) => ({ ...current, [field]: value }))
    setEstimate(null)
    setEstimateError("")
  }

  const parcelIsValid = Object.values(parcel).every((value) => Number.isFinite(Number(value)) && Number(value) > 0)
  const routeIsValid = pickup.address && delivery.address && pickup.coverage === "serviceable" && delivery.coverage === "serviceable"

  const calculateRates = async () => {
    if (!routeIsValid || !parcelIsValid) return

    setIsEstimating(true)
    setEstimateError("")
    try {
      const response = await fetch("/api/public/rates/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupAddress: pickup.address,
          deliveryAddress: delivery.address,
          weightKg: Number(parcel.weight),
          dimensionsCm: {
            length: Number(parcel.length),
            width: Number(parcel.width),
            height: Number(parcel.height),
          },
        }),
      })
      const data = (await response.json().catch(() => null)) as PublicRateEstimateResponse | PublicRateErrorResponse | null
      if (!response.ok) {
        setEstimateError(getErrorMessage(data as PublicRateErrorResponse | null, "We could not calculate rates for this shipment."))
        return
      }

      const result = data as PublicRateEstimateResponse
      if (!Array.isArray(result?.options)) {
        setEstimateError("The rate service returned an unexpected response. Please try again.")
        return
      }
      setEstimate(result)
      setStep(3)
    } catch {
      setEstimateError("Rates are temporarily unavailable. Please try again in a moment.")
    } finally {
      setIsEstimating(false)
    }
  }

  const handleShipNow = () => {
    if (authLoading) return
    if (user) {
      router.push("/ship-now")
      return
    }
    setShipAfterLogin(true)
    setIsLoginOpen(true)
  }

  return (
    <>
      <div className="overflow-hidden rounded-[1.75rem] border border-primary/15 bg-white shadow-2xl shadow-primary/10">
        <div className="bg-gradient-to-r from-primary to-brand-wine px-6 py-6 text-white sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Instant estimate</p>
              <h2 className="mt-2 text-2xl font-bold">Plan your delivery</h2>
              <p className="mt-1 text-sm leading-6 text-white/80">A few details are all we need to find your rate.</p>
            </div>
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 sm:flex">
              <Truck className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="border-b bg-brand-wine-soft/55 px-5 py-4 sm:px-8">
          <ol className="grid grid-cols-3 gap-2" aria-label="Rate estimate progress">
            {STEPS.map((label, index) => {
              const number = index + 1
              const active = step === number
              const complete = step > number
              return (
                <li key={label} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                      active && "border-primary bg-primary text-white",
                      complete && "border-brand-forest bg-brand-forest text-white",
                      !active && !complete && "border-border bg-white text-muted-foreground",
                    )}
                  >
                    {complete ? <Check className="h-3.5 w-3.5" /> : number}
                  </span>
                  <span className={cn("hidden text-xs font-semibold sm:block", active ? "text-primary" : "text-muted-foreground")}>{label}</span>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="p-5 sm:p-8">
          {step === 1 && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold">Where is it going?</h3>
              </div>

              <div className="space-y-5">
                <div>
                  <Label htmlFor="rate-pickup" className="mb-2 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-maple-soft text-brand-rust"><MapPin className="h-4 w-4" /></span>
                    Pickup address
                  </Label>
                  <AddressAutocomplete
                    id="rate-pickup"
                    value={pickup.value}
                    onChange={(value, place, source) => void handleAddressChange("pickup", value, place, source)}
                    placeholder="Start typing the pickup address"
                    className="h-12 bg-white pr-10"
                    required
                  />
                  <AddressStatus status={pickup.coverage} />
                </div>

                <div className="relative pl-0">
                  <Label htmlFor="rate-delivery" className="mb-2 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-forest-soft text-brand-forest"><MapPin className="h-4 w-4" /></span>
                    Drop-off address
                  </Label>
                  <AddressAutocomplete
                    id="rate-delivery"
                    value={delivery.value}
                    onChange={(value, place, source) => void handleAddressChange("delivery", value, place, source)}
                    placeholder="Start typing the drop-off address"
                    className="h-12 bg-white pr-10"
                    required
                  />
                  <AddressStatus status={delivery.coverage} />
                </div>
              </div>

              <Button className="mt-7 h-12 w-full text-base" disabled={!routeIsValid} onClick={() => setStep(2)}>
                Add parcel details <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div>
              <button type="button" onClick={() => setStep(1)} className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                <ArrowLeft className="h-4 w-4" /> Edit route
              </button>
              <div className="mb-6">
                <h3 className="text-xl font-bold">Tell us about the parcel</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">Enter the packed size in centimetres and total weight in kilograms.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">Dimensions</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {(["length", "width", "height"] as ParcelField[]).map((field) => (
                      <div key={field}>
                        <Label htmlFor={`rate-${field}`} className="mb-2 block capitalize">{field}</Label>
                        <div className="relative">
                          <Input
                            id={`rate-${field}`}
                            type="number"
                            inputMode="decimal"
                            min="0.01"
                            step="0.01"
                            value={parcel[field]}
                            onChange={(event) => setParcelField(field, event.target.value)}
                            className="h-11 pr-10"
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">cm</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Scale className="h-4 w-4 text-primary" />
                    <Label htmlFor="rate-weight">Packed weight</Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="rate-weight"
                      type="number"
                      inputMode="decimal"
                      min="0.01"
                      step="0.01"
                      value={parcel.weight}
                      onChange={(event) => setParcelField("weight", event.target.value)}
                      className="h-12 pr-12"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">kg</span>
                  </div>
                </div>

              </div>

              {estimateError && (
                <Alert variant="destructive" className="mt-5">
                  <AlertDescription>{estimateError}</AlertDescription>
                </Alert>
              )}

              <Button className="mt-7 h-12 w-full text-base" disabled={!parcelIsValid || isEstimating} onClick={() => void calculateRates()}>
                {isEstimating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculating…</> : <>See delivery rates <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </div>
          )}

          {step === 3 && estimate && (
            <div>
              <button type="button" onClick={() => setStep(2)} className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                <ArrowLeft className="h-4 w-4" /> Edit parcel
              </button>
              <div className="mb-6">
                <h3 className="text-xl font-bold">Choose your service</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">Taxes are included below. Your final rate is confirmed during booking.</p>
              </div>

              <div className="space-y-4">
                {estimate.options.map((option) => {
                  const priority = option.serviceLevel === "PRIORITY"
                  const summary = priceSummary(option)
                  const currency = option.pricing?.currency || "CAD"
                  const unavailable = !option.available || option.pricing?.customQuoteRequired

                  return (
                    <article key={option.serviceLevel} className={cn("overflow-hidden rounded-2xl border-2 bg-white", priority ? "border-primary/50 shadow-lg shadow-primary/10" : "border-border")}>
                      <div className={cn("flex items-start justify-between gap-3 px-5 py-4", priority ? "bg-brand-wine-soft/70" : "bg-brand-forest-soft/55")}>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-lg font-bold capitalize">{option.serviceLevel.toLowerCase()}</h4>
                            {priority && <Badge className="bg-primary text-[10px] uppercase tracking-wide">Faster option</Badge>}
                          </div>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            {priority ? "Priority handling from pickup to delivery—or your priority fee is refunded." : "Reliable service for your everyday local delivery."}
                          </p>
                        </div>
                        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", priority ? "bg-primary text-white" : "bg-brand-forest text-white")}>
                          {priority ? <Clock3 className="h-4 w-4" /> : <PackageCheck className="h-4 w-4" />}
                        </span>
                      </div>

                      <div className="px-5 py-5">
                        {unavailable ? (
                          <div>
                            <p className="font-semibold">This shipment needs a closer look.</p>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">{option.pricing?.customQuoteReason || "Our team can review the details and prepare a custom rate."}</p>
                            <Button asChild variant="outline" className="mt-4 w-full">
                              <Link href="/#get-in-touch">Get in Touch</Link>
                            </Button>
                          </div>
                        ) : (
                          <>
                            <dl className="space-y-2 text-sm">
                              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Subtotal</dt><dd className="font-medium">{formatMoney(summary.subtotal, currency)}</dd></div>
                              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Tax</dt><dd className="font-medium">{formatMoney(summary.tax, currency)}</dd></div>
                              <div className="mt-3 flex items-end justify-between gap-4 border-t pt-4">
                                <dt className="font-bold">Estimated total</dt>
                                <dd className="text-2xl font-bold text-primary">{formatMoney(summary.total, currency)}</dd>
                              </div>
                            </dl>
                            <Button className="mt-5 h-11 w-full" disabled={authLoading} onClick={handleShipNow}>
                              Ship Now <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>

              <button type="button" onClick={() => setStep(1)} className="mt-6 w-full text-center text-sm font-semibold text-primary hover:underline">
                Start a new estimate
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t bg-muted/30 px-5 py-4 text-xs leading-5 text-muted-foreground sm:px-8">
          <Sparkles className="h-4 w-4 shrink-0 text-brand-rust" />
          Estimates use the parcel and address details you provide; no order is created yet.
        </div>
      </div>

      <Dialog open={outOfAreaKind !== null} onOpenChange={(open) => !open && setOutOfAreaKind(null)}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-md">
          <div className="bg-gradient-to-br from-brand-maple-soft to-brand-wine-soft px-6 pb-5 pt-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary shadow-md">
              <MapPin className="h-7 w-7" />
            </span>
          </div>
          <div className="px-6 pb-6">
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-2xl">Oops—this stop is off our usual route.</DialogTitle>
              <DialogDescription className="pt-2 text-sm leading-6">
                We do not currently offer standard online rates for this {outOfAreaKind} address. Unusual routes are worth a conversation, though—we may still be able to accommodate your request.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6 gap-2 sm:space-x-0">
              <Button variant="outline" onClick={() => setOutOfAreaKind(null)}>Not now</Button>
              <Button asChild onClick={() => setOutOfAreaKind(null)}>
                <Link href="/#get-in-touch">Get in Touch</Link>
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onOpenSignup={() => {
          setIsLoginOpen(false)
          setIsSignupOpen(true)
        }}
      />
      <SignupModal
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        onSignupSuccess={(email) => {
          setIsSignupOpen(false)
          setVerificationEmail(email)
        }}
        onOpenLogin={() => {
          setIsSignupOpen(false)
          setIsLoginOpen(true)
        }}
      />
      <Dialog open={Boolean(verificationEmail)} onOpenChange={(open) => !open && setVerificationEmail("")}>
        <DialogContent className="border-0 bg-transparent p-0 shadow-none sm:max-w-md">
          {verificationEmail && (
            <VerificationPending
              email={verificationEmail}
              onClose={() => setVerificationEmail("")}
              onConfirmed={() => {
                setVerificationEmail("")
                setIsLoginOpen(true)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
