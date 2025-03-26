import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, pointOfContact } = body

    // Validate required fields
    if (
      !userId ||
      !name ||
      !pointOfContact ||
      !pointOfContact.name ||
      !pointOfContact.position ||
      !pointOfContact.phone
    ) {
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
    const endpoint = `${BASE_URL}/profile/organization`

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
        name,
        pointOfContact,
      }),
    })

    // Get the response data
    const data = await response.json()

    // Return the response
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Create organization profile error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the userId from query params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ message: "userId is required" }, { status: 400 })
    }

    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    // Use the correct base URL and endpoint
    const BASE_URL = process.env.NEXT_PUBLIC_PROFILE_SERVICE_URL || "http://localhost:30081/usermanagement"
    const endpoint = `${BASE_URL}/profile/organization?userId=${userId}`

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
    console.error("Get organization profile error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

