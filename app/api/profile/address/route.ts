import { type NextRequest, NextResponse } from "next/server"

// Get all addresses for a user
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
    const endpoint = `${BASE_URL}/profile/individual/${userId}/address`

    // Forward the request to your microservice
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    // Get the response data
    const data = await response.json()

    // Return the response
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Get addresses error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// Create a new address
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...addressData } = body

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
    const endpoint = `${BASE_URL}/profile/individual/${userId}/address`

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
    const data = await response.json()

    // Return the response
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Create address error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// Update an address
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...addressData } = body

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
    const endpoint = `${BASE_URL}/profile/individual/${userId}/address`

    // Forward the request to your microservice
    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(addressData),
    })

    // Get the response data
    const data = await response.json()

    // Return the response
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Update address error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// Delete an address
export async function DELETE(request: NextRequest) {
  try {
    // Get the userId and addressId from query params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const addressId = searchParams.get("addressId")

    if (!userId || !addressId) {
      return NextResponse.json({ message: "userId and addressId are required" }, { status: 400 })
    }

    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    // Use the correct base URL and endpoint
    const BASE_URL = process.env.NEXT_PUBLIC_PROFILE_SERVICE_URL || "http://localhost:30081/usermanagement"
    const endpoint = `${BASE_URL}/profile/individual/${userId}/address/${addressId}`

    // Forward the request to your microservice
    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    // If the response is 204 No Content, return success
    if (response.status === 204) {
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // Otherwise, get the response data
    const data = await response.json()

    // Return the response
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Delete address error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

