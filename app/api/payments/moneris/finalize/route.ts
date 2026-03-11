import { type NextRequest, NextResponse } from "next/server"
import { MONERIS_API_CONFIG } from "@/lib/config"

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

function buildHeaders(token: string | null): HeadersInit {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getToken(request)
    const body = await request.json()

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const response = await fetch(`${MONERIS_API_CONFIG.baseUrl}finalize`, {
      method: "POST",
      headers: buildHeaders(token),
      body: JSON.stringify(body),
      cache: "no-store",
    })

    const raw = await response.text()
    if (!raw) {
      return NextResponse.json(
        { message: response.ok ? "Payment finalized successfully" : "Failed to finalize payment" },
        { status: response.status },
      )
    }

    try {
      return NextResponse.json(JSON.parse(raw), { status: response.status })
    } catch {
      return NextResponse.json({ message: raw }, { status: response.status })
    }
  } catch (error) {
    console.error("Finalize payment error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
