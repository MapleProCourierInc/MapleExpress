import { type NextRequest, NextResponse } from "next/server"
import { checkAuthenticatedServiceability } from "@/lib/serviceability-server"

function getToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return request.cookies.get("accessToken")?.value || request.cookies.get("maplexpress_access_token")?.value || null
  }

  return authHeader.split(" ")[1]
}

export async function POST(request: NextRequest) {
  const token = getToken(request)
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as { latitude?: number; longitude?: number }
  const latitude = Number(body.latitude)
  const longitude = Number(body.longitude)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ message: "Valid latitude and longitude are required." }, { status: 400 })
  }

  try {
    const response = await checkAuthenticatedServiceability(latitude, longitude, token)
    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to check serviceability right now." },
      { status: 502 },
    )
  }
}

