import { type NextRequest, NextResponse } from "next/server"

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  try {
    const { addressId } = await params
    const addressData = await request.json()

    const token = getToken(request)
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const endpoint = `${BASE_URL}/profile/addresses/${addressId}`

    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(addressData),
    })

    const data = await getJsonResponse(response)

    return NextResponse.json(data ?? {}, { status: response.status })
  } catch (error) {
    console.error("Update address error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  try {
    const { addressId } = await params

    const token = getToken(request)
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const endpoint = `${BASE_URL}/profile/addresses/${addressId}`

    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.status === 204) {
      return NextResponse.json({ success: true }, { status: 200 })
    }

    const data = await getJsonResponse(response)

    return NextResponse.json(data ?? {}, { status: response.status })
  } catch (error) {
    console.error("Delete address error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
