import { type NextRequest, NextResponse } from "next/server"
import { AUTH_MICROSERVICE_URL, getEndpointUrl } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate required fields
    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 })
    }

    // Use the endpoint from our centralized configuration
    const resendVerificationEndpoint = getEndpointUrl(AUTH_MICROSERVICE_URL, 'resend-verification-email')

    // Forward the request to your microservice
    const response = await fetch(resendVerificationEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Real-IP": request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
      body: JSON.stringify({ email }),
    })

    // Get the response data
    const data = await response.json()

    // Return the response
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
