import { NextResponse } from "next/server"
import { getTrackingEvents } from "@/lib/tracking-service"

type RouteContext = {
  params: Promise<{
    trackingNumber: string
  }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { trackingNumber } = await context.params
  const normalizedTrackingNumber = trackingNumber.trim()

  if (!normalizedTrackingNumber) {
    return NextResponse.json({ message: "Tracking number is required." }, { status: 400 })
  }

  try {
    const events = await getTrackingEvents(normalizedTrackingNumber)
    return NextResponse.json(events)
  } catch (error) {
    console.error("Public tracking error:", error)
    return NextResponse.json(
      { message: "Tracking is temporarily unavailable. Please try again shortly." },
      { status: 502 },
    )
  }
}
