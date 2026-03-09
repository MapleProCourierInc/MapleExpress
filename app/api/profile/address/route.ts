import { type NextRequest, NextResponse } from "next/server"
import { checkAuthenticatedServiceability } from "@/lib/serviceability-server"

const BASE_URL = process.env.NEXT_PUBLIC_PROFILE_SERVICE_URL || "http://localhost:30081/usermanagement"

function getToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return (
      request.cookies.get("maplexpress_access_token")?.value ||
      request.cookies.get("accessToken")?.value ||
      null
    )
  }

  return authHeader.slice("Bearer ".length).trim() || null
}

async function getJsonResponse(response: Response) {
  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

// Get all addresses for a user
export async function GET(request: NextRequest) {
  try {
    const token = getToken(request)
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const endpoint = `${BASE_URL}/profile/addresses`

    // Forward the request to your microservice
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    // Get the response data
    const data = await getJsonResponse(response)

    // Return the response
    return NextResponse.json(data ?? {}, { status: response.status })
  } catch (error) {
    console.error("Get addresses error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// Create a new address
export async function POST(request: NextRequest) {
  try {
    const addressData = await request.json()

    const token = getToken(request)
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const latitude = Number(addressData?.coordinates?.latitude)
    const longitude = Number(addressData?.coordinates?.longitude)

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      const serviceability = await checkAuthenticatedServiceability(latitude, longitude, token)
      if (!serviceability.serviceable) {
        return NextResponse.json(
          { message: serviceability.message || "Location is outside MapleX serviceable area." },
          { status: 400 },
        )
      }
    }

    const endpoint = `${BASE_URL}/profile/addresses`

    // Forward the request to your microservice
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(addressData),
    })

    // Get the response data
    const data = await getJsonResponse(response)

    // Return the response
    return NextResponse.json(data ?? {}, { status: response.status })
  } catch (error) {
    console.error("Create address error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
