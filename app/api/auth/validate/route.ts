import { type NextRequest, NextResponse } from "next/server"
import { AUTH_MICROSERVICE_URL, AUTH_API_KEY, getEndpointUrl } from "@/lib/config"

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    // Use the endpoint from our centralized configuration
    const validateEndpoint = getEndpointUrl(AUTH_MICROSERVICE_URL, 'validate')

    // Forward the request to your microservice
    const response = await fetch(validateEndpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        // You can add any additional headers your microservice requires
        "x-api-key": AUTH_API_KEY,
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
