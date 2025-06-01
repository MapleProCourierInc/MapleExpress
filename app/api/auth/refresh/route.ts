import { type NextRequest, NextResponse } from "next/server"
import { AUTH_REFRESH_URL } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json({ message: "Refresh token is required" }, { status: 400 })
    }

    // Use the refresh URL from our centralized configuration

    const response = await fetch(AUTH_REFRESH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Language": "application/json",
        "X-Real-IP": request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
      body: JSON.stringify({ refreshToken }),
    })

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json(data, { status: 200 })
    } else {
      return NextResponse.json({ message: data.message || "Failed to refresh token" }, { status: response.status })
    }
  } catch (error) {
    console.error("Token refresh error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
