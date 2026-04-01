import { type NextRequest, NextResponse } from "next/server"
import { PROFILE_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"
import { checkAuthenticatedServiceability } from "@/lib/serviceability-server"

async function getJsonResponse(response: Response) {
  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

export async function GET(request: NextRequest) {
  try {
    const response = await proxyWithAuthRetry(request, {
      method: "GET",
      url: getEndpointUrl(PROFILE_SERVICE_URL, "/profile/addresses"),
    })

    const parsed = await getJsonResponse(response)
    return NextResponse.json(parsed ?? {}, { status: response.status })
  } catch (error) {
    console.error("Get addresses error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const addressData = await request.json()

    const latitude = Number(addressData?.coordinates?.latitude)
    const longitude = Number(addressData?.coordinates?.longitude)

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      const serviceability = await checkAuthenticatedServiceability(latitude, longitude)
      if (!serviceability.serviceable) {
        return NextResponse.json(
          { message: serviceability.message || "Location is outside MapleX serviceable area." },
          { status: 400 },
        )
      }
    }

    const response = await proxyWithAuthRetry(request, {
      method: "POST",
      url: getEndpointUrl(PROFILE_SERVICE_URL, "/profile/addresses"),
      body: JSON.stringify(addressData),
      contentTypeJson: true,
    })

    const parsed = await getJsonResponse(response)
    return NextResponse.json(parsed ?? {}, { status: response.status })
  } catch (error) {
    console.error("Create address error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
