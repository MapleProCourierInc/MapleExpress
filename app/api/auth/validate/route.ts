import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    // Replace with your actual microservice endpoint
    const MICROSERVICE_URL = process.env.AUTH_MICROSERVICE_URL || "https://your-auth-service.com/api/validate"

    // Forward the request to your microservice
    const response = await fetch(MICROSERVICE_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        // You can add any additional headers your microservice requires
        "x-api-key": process.env.AUTH_API_KEY || "",
      },
    })

    const data = await response.json()

    // Return the response from your microservice
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Token validation error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

