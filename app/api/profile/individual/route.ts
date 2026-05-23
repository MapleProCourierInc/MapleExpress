import { type NextRequest, NextResponse } from "next/server"
import { PROFILE_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, firstName, lastName, dateOfBirth, phone } = body

    if (!userId || !firstName || !lastName || !dateOfBirth || !phone) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    return await proxyWithAuthRetry(request, {
      method: "POST",
      url: getEndpointUrl(PROFILE_SERVICE_URL, "/profile/individual"),
      body: JSON.stringify({
        userId,
        firstName,
        lastName,
        dateOfBirth,
        phone,
        type: "client",
      }),
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("Create individual profile error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    return await proxyWithAuthRetry(request, {
      method: "GET",
      url: getEndpointUrl(PROFILE_SERVICE_URL, "/profile/individual"),
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("Get individual profile error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
