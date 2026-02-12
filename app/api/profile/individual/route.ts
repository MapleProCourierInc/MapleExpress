import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const getBearerToken = async (request: NextRequest) => {
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1]
  }

  const cookieStore = await cookies()
  return cookieStore.get("maplexpress_access_token")?.value || cookieStore.get("accessToken")?.value
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, firstName, lastName, dateOfBirth, phone } = body

    if (!userId || !firstName || !lastName || !dateOfBirth || !phone) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const token = await getBearerToken(request)
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const BASE_URL = process.env.NEXT_PUBLIC_PROFILE_SERVICE_URL || "http://localhost:30081/usermanagement"
    const endpoint = `${BASE_URL}/profile/individual`

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

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Create individual profile error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const email = searchParams.get("email")

    if (!userId && !email) {
      return NextResponse.json({ message: "userId or email is required" }, { status: 400 })
    }

    const token = await getBearerToken(request)
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const BASE_URL = process.env.NEXT_PUBLIC_PROFILE_SERVICE_URL || "http://localhost:30081/usermanagement"
    const endpoint = userId ? `${BASE_URL}/profile/individual?userId=${userId}` : `${BASE_URL}/profile/individual?email=${email}`

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Get individual profile error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
