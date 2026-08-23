import { type NextRequest, NextResponse } from "next/server"

import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"
import { PROFILE_SERVICE_URL, getEndpointUrl } from "@/lib/config.server"

const BILLING_ADDRESS_PATH = "/profile/addresses/billing-address"

export async function GET(request: NextRequest) {
  try {
    return await proxyWithAuthRetry(request, {
      method: "GET",
      url: getEndpointUrl(PROFILE_SERVICE_URL, BILLING_ADDRESS_PATH),
    })
  } catch (error) {
    console.error("Get profile billing address error:", error)
    return NextResponse.json({ message: "Unable to load billing address" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const requiredFields = [
      "fullName",
      "streetAddress",
      "city",
      "province",
      "postalCode",
      "country",
      "phoneNumber",
    ] as const

    const missingField = requiredFields.find(
      (field) => typeof body?.[field] !== "string" || body[field].trim().length === 0,
    )

    if (missingField) {
      return NextResponse.json({ message: `${missingField} is required` }, { status: 400 })
    }

    const billingAddress = {
      ...(typeof body.addressId === "string" && body.addressId.trim()
        ? { addressId: body.addressId.trim() }
        : {}),
      fullName: body.fullName.trim(),
      company: typeof body.company === "string" ? body.company.trim() : "",
      streetAddress: body.streetAddress.trim(),
      addressLine2: typeof body.addressLine2 === "string" ? body.addressLine2.trim() : "",
      city: body.city.trim(),
      province: body.province.trim(),
      postalCode: body.postalCode.trim().toUpperCase(),
      country: body.country.trim(),
      phoneNumber: body.phoneNumber.trim(),
      deliveryInstructions:
        typeof body.deliveryInstructions === "string" ? body.deliveryInstructions.trim() : "",
      addressType: "billing",
      coordinates:
        Number.isFinite(Number(body?.coordinates?.latitude)) &&
        Number.isFinite(Number(body?.coordinates?.longitude))
          ? {
              latitude: Number(body.coordinates.latitude),
              longitude: Number(body.coordinates.longitude),
            }
          : undefined,
      isPrimary: true,
    }

    return await proxyWithAuthRetry(request, {
      method: "PUT",
      url: getEndpointUrl(PROFILE_SERVICE_URL, BILLING_ADDRESS_PATH),
      body: JSON.stringify(billingAddress),
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("Update profile billing address error:", error)
    return NextResponse.json({ message: "Unable to save billing address" }, { status: 500 })
  }
}
