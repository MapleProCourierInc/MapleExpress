import { NextRequest, NextResponse } from "next/server"
import { checkPublicServiceability } from "@/lib/public-serviceability-service"

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { latitude?: number; longitude?: number }

  const latitude = Number(body.latitude)
  const longitude = Number(body.longitude)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ message: "Valid latitude and longitude are required." }, { status: 400 })
  }

  try {
    const response = await checkPublicServiceability(latitude, longitude)
    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ message: "Unable to check availability right now." }, { status: 502 })
  }
}
