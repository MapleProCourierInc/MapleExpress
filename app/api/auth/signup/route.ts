import { type NextRequest, NextResponse } from "next/server"
import { AUTH_MICROSERVICE_URL, getEndpointUrl } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, type, password, tosAgreement, communicationConsent } = body

    // Validate required fields
    if (!email || !type || !password || tosAgreement === undefined) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Use the endpoint from our centralized configuration
    const signupEndpoint = getEndpointUrl(AUTH_MICROSERVICE_URL, 'createuser')

    // Forward the request to your microservice
    const response = await fetch(signupEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Real-IP": request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
      body: JSON.stringify({
        email,
        type,
        password,
        tosAgreement,
        communicationConsent,
      }),
    })

    // Get the response data
    const data = await response.json()

    // Return the response
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
