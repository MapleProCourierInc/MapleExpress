import { type NextRequest, NextResponse } from "next/server"
import { PROFILE_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    return await proxyWithAuthRetry(request, {
      method: "POST",
      url: getEndpointUrl(PROFILE_SERVICE_URL, "/profile/onboarding"),
      body: JSON.stringify(body),
      includeIdToken: true,
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("Onboarding route error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
