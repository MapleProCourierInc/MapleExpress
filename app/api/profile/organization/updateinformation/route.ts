import { type NextRequest, NextResponse } from "next/server"
import { PROFILE_SERVICE_URL, getEndpointUrl } from "@/lib/config.server"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"
import { isValidOptionalPhoneNumber, PHONE_NUMBER_VALIDATION_MESSAGE } from "@/lib/phone-validation"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, registrationNumber, taxID, industry, phone, websiteUrl, pointOfContact } = body

    if (!userId) {
      return NextResponse.json({ message: "userId is required" }, { status: 400 })
    }
    if (!isValidOptionalPhoneNumber(phone)) {
      return NextResponse.json({ message: `Organization ${PHONE_NUMBER_VALIDATION_MESSAGE.toLowerCase()}` }, { status: 400 })
    }
    if (!isValidOptionalPhoneNumber(pointOfContact?.phone)) {
      return NextResponse.json({ message: `Point of contact ${PHONE_NUMBER_VALIDATION_MESSAGE.toLowerCase()}` }, { status: 400 })
    }

    return await proxyWithAuthRetry(request, {
      method: "PUT",
      url: getEndpointUrl(PROFILE_SERVICE_URL, `/profile/organization/user/${userId}`),
      body: JSON.stringify({
        registrationNumber,
        taxID,
        industry,
        phone,
        websiteUrl,
        pointOfContactName: pointOfContact?.name,
        pointOfContactPosition: pointOfContact?.position,
        pointOfContactEmail: pointOfContact?.email,
        pointOfContactPhone: pointOfContact?.phone,
      }),
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("Update organization information error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
