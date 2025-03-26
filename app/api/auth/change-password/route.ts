import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, currentPassword, newPassword } = body

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 })
    }

    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    // Use the correct base URL and endpoint
    const AUTH_URL = process.env.AUTH_MICROSERVICE_URL || "http://localhost:30080/usermanagement/auth"
    const endpoint = `${AUTH_URL}/change-password`

    // Forward the request to your microservice
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId,
        currentPassword,
        newPassword,
      }),
    })

    // Get the response data
    const data = await response.json()

    // Return the response
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

