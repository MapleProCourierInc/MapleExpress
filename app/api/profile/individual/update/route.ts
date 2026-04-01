import { type NextRequest, NextResponse } from "next/server"
import { PROFILE_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...profileData } = body

    if (!userId) {
      return NextResponse.json({ message: "userId is required" }, { status: 400 })
    }

    return await proxyWithAuthRetry(request, {
      method: "PATCH",
      url: getEndpointUrl(PROFILE_SERVICE_URL, `/profile/individual/${userId}`),
      body: JSON.stringify(profileData),
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("Update individual profile error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
