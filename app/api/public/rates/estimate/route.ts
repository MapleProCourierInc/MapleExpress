import { type NextRequest, NextResponse } from "next/server"
import { estimatePublicRates } from "@/lib/public-rate-estimate-service"
import type { PublicRateAddress, PublicRateEstimateRequest } from "@/types/public-rates"

function problem(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: "about:blank", title, status, detail },
    { status, headers: { "Content-Type": "application/problem+json" } },
  )
}

function isAddress(value: unknown): value is PublicRateAddress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false

  const address = value as Record<string, unknown>
  return ["streetAddress", "city", "province", "postalCode", "country"].every(
    (key) => typeof address[key] === "string" && address[key].trim().length > 0,
  )
}

function isPositiveNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
}

function isValidRequest(value: unknown): value is PublicRateEstimateRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false

  const body = value as Record<string, unknown>
  const dimensions = body.dimensionsCm
  if (!dimensions || typeof dimensions !== "object" || Array.isArray(dimensions)) return false

  const parcel = dimensions as Record<string, unknown>
  return (
    isAddress(body.pickupAddress) &&
    isAddress(body.deliveryAddress) &&
    isPositiveNumber(body.weightKg) &&
    isPositiveNumber(parcel.length) &&
    isPositiveNumber(parcel.width) &&
    isPositiveNumber(parcel.height) &&
    (body.signatureRequired === undefined || typeof body.signatureRequired === "boolean")
  )
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)

  if (!isValidRequest(body)) {
    return problem(400, "Invalid shipment details", "Complete both addresses and enter positive parcel measurements.")
  }

  try {
    const response = await estimatePublicRates(body)
    const headers = new Headers()
    const contentType = response.headers.get("content-type")
    if (contentType) headers.set("Content-Type", contentType)

    return new NextResponse(await response.text(), {
      status: response.status,
      headers,
    })
  } catch (error) {
    console.error("Public rate estimate error:", error)
    return problem(502, "Rate estimate unavailable", "We could not calculate rates right now. Please try again shortly.")
  }
}
