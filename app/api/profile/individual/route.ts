import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, firstName, lastName, dateOfBirth, phone } = body

    // Validate required fields
    if (!userId || !firstName || !lastName || !dateOfBirth || !phone) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    // Use the correct base URL and endpoint
    const BASE_URL = process.env.NEXT_PUBLIC_PROFILE_SERVICE_URL || "http://localhost:30081/usermanagement"
    const endpoint = `${BASE_URL}/profile/individual`

    // Forward the request to your microservice
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "X-Real-IP": request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
      body: JSON.stringify({
        userId,
        firstName,
        lastName,
        dateOfBirth,
        phone,
        type: "client",
      }),
    })

    // Get the response data
    const data = await response.json()

    // Return the response
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Create individual profile error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the userId or email from query params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const email = searchParams.get("email")

    if (!userId && !email) {
      return NextResponse.json(
        { message: "userId or email is required" },
        { status: 400 },
      )
    }

    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    // Use the correct base URL and endpoint
    const BASE_URL =
      process.env.NEXT_PUBLIC_PROFILE_SERVICE_URL ||
      "http://localhost:30081/usermanagement"
    const endpoint = userId
      ? `${BASE_URL}/profile/individual?userId=${userId}`
      : `${BASE_URL}/profile/individual?email=${email}`

    // Forward the request to your microservice
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    // Get the response data
    const data = await response.json()

    // Return the response
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Get individual profile error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

