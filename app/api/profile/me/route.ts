import { type NextRequest, NextResponse } from "next/server"
import { PROFILE_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"

export async function GET(request: NextRequest) {
  try {
    return await proxyWithAuthRetry(request, {
      method: "GET",
      url: getEndpointUrl(PROFILE_SERVICE_URL, "/me"),
      includeIdToken: true,
    })
  } catch (error) {
    console.error("Get /me error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
