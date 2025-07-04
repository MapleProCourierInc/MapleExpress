import { type NextRequest, NextResponse } from "next/server"
import { AUTH_MICROSERVICE_URL, getEndpointUrl } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = body

    if (!token || !newPassword) {
      return NextResponse.json(
        { message: "Token and new password are required" },
        { status: 400 }
      )
    }

    const endpoint = getEndpointUrl(AUTH_MICROSERVICE_URL, "reset-password")

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Language": "application/json",
        "X-Real-IP": request.headers.get("x-forwarded-for") || "127.0.0.1",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ newPassword }),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
