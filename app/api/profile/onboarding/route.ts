import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { PROFILE_SERVICE_URL, getEndpointUrl } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken =
      cookieStore.get("maplexpress_access_token")?.value ||
      cookieStore.get("accessToken")?.value
    const idToken = cookieStore.get("maplexpress_id_token")?.value

    if (!accessToken || !idToken) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const response = await fetch(getEndpointUrl(PROFILE_SERVICE_URL, "/onboarding"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Id-Token": idToken,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Onboarding error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
