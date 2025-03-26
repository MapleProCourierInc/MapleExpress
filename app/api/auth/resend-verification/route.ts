import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, uid } = body

    // Validate required fields
    if (!email || !uid) {
      return NextResponse.json({ message: "Email and user ID are required" }, { status: 400 })
    }

    // Use the exact endpoint provided
    const MICROSERVICE_URL = "http://192.168.50.167:30080/usermanagement/auth/resend-verification-email"

    // Forward the request to your microservice
    const response = await fetch(MICROSERVICE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Real-IP": request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
      body: JSON.stringify({ email, uid }),
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

