import { type NextRequest, NextResponse } from "next/server"
import { AUTH_MICROSERVICE_URL, getEndpointUrl } from "@/lib/config"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 })
    }

    return await proxyWithAuthRetry(request, {
      method: "POST",
      url: getEndpointUrl(AUTH_MICROSERVICE_URL, "reset-password"),
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
