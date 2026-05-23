import { type NextRequest, NextResponse } from "next/server"
import { PROFILE_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const taxID = typeof body?.taxID === "string" ? body.taxID.trim() : ""

    return await proxyWithAuthRetry(request, {
      method: "PUT",
      url: getEndpointUrl(PROFILE_SERVICE_URL, "/profile/tax-id"),
      body: JSON.stringify({ taxID }),
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("Update profile tax ID error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
