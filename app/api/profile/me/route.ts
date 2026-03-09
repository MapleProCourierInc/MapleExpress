import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { PROFILE_SERVICE_URL, getEndpointUrl } from "@/lib/config"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const accessToken =
      cookieStore.get("maplexpress_access_token")?.value ||
      cookieStore.get("accessToken")?.value
    const idToken = cookieStore.get("maplexpress_id_token")?.value

    if (!accessToken || !idToken) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const response = await fetch(getEndpointUrl(PROFILE_SERVICE_URL, "/me"), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Id-Token": idToken,
      },
      cache: "no-store",
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Get /me error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
