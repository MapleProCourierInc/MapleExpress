import { type NextRequest, NextResponse } from "next/server"
import { ORDER_SERVICE_URL, getEndpointUrl } from "@/lib/config"

function getToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return (
      request.cookies.get("accessToken")?.value ||
      request.cookies.get("maplexpress_access_token")?.value ||
      null
    )
  }

  return authHeader.split(" ")[1]
}

function buildHeaders(token: string | null, contentType = false): HeadersInit {
  return {
    accept: "application/json",
    ...(contentType ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = getToken(request)
    const search = request.nextUrl.search
    const url = getEndpointUrl(ORDER_SERVICE_URL, `orders${search}`)

    const response = await fetch(url, {
      method: "GET",
      headers: buildHeaders(token, true),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Get orders error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getToken(request)
    const body = await request.json()
    const url = getEndpointUrl(ORDER_SERVICE_URL, "orders")

    const response = await fetch(url, {
      method: "POST",
      headers: buildHeaders(token, true),
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Create order error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = getToken(request)
    const body = await request.json()
    const url = getEndpointUrl(ORDER_SERVICE_URL, "orders")

    const response = await fetch(url, {
      method: "PUT",
      headers: buildHeaders(token, true),
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Update order error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
