import { type NextRequest, NextResponse } from "next/server"
import { PROFILE_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, phone } = body

    if (!userId) {
      return NextResponse.json({ message: "userId is required" }, { status: 400 })
    }

    return await proxyWithAuthRetry(request, {
      method: "PUT",
      url: getEndpointUrl(PROFILE_SERVICE_URL, `/profile/individual/user/${userId}`),
      body: JSON.stringify({ phone }),
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("Update individual information error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
