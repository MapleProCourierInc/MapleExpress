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
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const email = searchParams.get("email")

    if (!userId && !email) {
      return NextResponse.json({ message: "userId or email is required" }, { status: 400 })
    }

    const endpoint = userId
      ? getEndpointUrl(PROFILE_SERVICE_URL, `/profile/individual?userId=${encodeURIComponent(userId)}`)
      : getEndpointUrl(PROFILE_SERVICE_URL, `/profile/individual?email=${encodeURIComponent(email || "")}`)

    return await proxyWithAuthRetry(request, {
      method: "GET",
      url: endpoint,
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("Get individual profile error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
