import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Use the exact endpoint provided
    const MICROSERVICE_URL =
      process.env.AUTH_MICROSERVICE_URL || "http://192.168.50.167:30080/usermanagement/auth/login"

    // Forward the request to your microservice with the exact headers needed
    const response = await fetch(MICROSERVICE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Language": "application/json",
        "X-Real-IP": request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
      body: JSON.stringify({ email, password }),
    })

    // Get the response data
    const data = await response.json()

    // If successful, return the data
    if (response.ok) {
      return NextResponse.json(data, { status: 200 })
    } else {
      // If there's an error, format it appropriately
      return NextResponse.json({ message: data.message || "Authentication failed" }, { status: response.status })
    }
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

