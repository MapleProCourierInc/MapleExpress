import { type NextRequest, NextResponse } from "next/server"
import { PROFILE_SERVICE_URL, getEndpointUrl } from "@/lib/config.server"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"
import { isValidOptionalPhoneNumber, PHONE_NUMBER_VALIDATION_MESSAGE } from "@/lib/phone-validation"

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...profileData } = body

    if (!userId) {
      return NextResponse.json({ message: "userId is required" }, { status: 400 })
    }
    if (!isValidOptionalPhoneNumber(profileData.phone)) {
      return NextResponse.json({ message: `Organization ${PHONE_NUMBER_VALIDATION_MESSAGE.toLowerCase()}` }, { status: 400 })
    }
    if (!isValidOptionalPhoneNumber(profileData.pointOfContact?.phone)) {
      return NextResponse.json({ message: `Point of contact ${PHONE_NUMBER_VALIDATION_MESSAGE.toLowerCase()}` }, { status: 400 })
    }

    return await proxyWithAuthRetry(request, {
      method: "PATCH",
      url: getEndpointUrl(PROFILE_SERVICE_URL, `/profile/organization/${userId}`),
      body: JSON.stringify(profileData),
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("Update organization profile error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
