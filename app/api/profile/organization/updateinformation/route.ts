import { type NextRequest, NextResponse } from "next/server"
import { PROFILE_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, registrationNumber, taxId, industry, phone, websiteUrl, pointOfContact } = body

    if (!userId) {
      return NextResponse.json({ message: "userId is required" }, { status: 400 })
    }

    return await proxyWithAuthRetry(request, {
      method: "PUT",
      url: getEndpointUrl(PROFILE_SERVICE_URL, `/profile/organization/user/${userId}`),
      body: JSON.stringify({
        registrationNumber,
        taxId,
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
