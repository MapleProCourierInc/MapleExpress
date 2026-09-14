import { type NextRequest, NextResponse } from "next/server"
import { PROFILE_SERVICE_URL, getEndpointUrl } from "@/lib/config.server"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"
import {
  isValidOptionalPhoneNumber,
  isValidPhoneNumber,
  PHONE_NUMBER_VALIDATION_MESSAGE,
} from "@/lib/phone-validation"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userType = String(body?.userType || "").toUpperCase()
    const details = body?.details

    if (userType === "INDIVIDUAL" && !isValidOptionalPhoneNumber(details?.phone)) {
      return NextResponse.json({ message: PHONE_NUMBER_VALIDATION_MESSAGE }, { status: 400 })
    }
    if (userType === "ORGANIZATION") {
      if (!isValidPhoneNumber(details?.phone)) {
        return NextResponse.json({ message: `Business ${PHONE_NUMBER_VALIDATION_MESSAGE.toLowerCase()}` }, { status: 400 })
      }
      if (!isValidPhoneNumber(details?.pointOfContact?.phone)) {
        return NextResponse.json({ message: `Point of contact ${PHONE_NUMBER_VALIDATION_MESSAGE.toLowerCase()}` }, { status: 400 })
      }
    }

    return await proxyWithAuthRetry(request, {
      method: "POST",
      url: getEndpointUrl(PROFILE_SERVICE_URL, "/onboarding"),
      body: JSON.stringify(body),
      includeIdToken: true,
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("Onboarding route error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
