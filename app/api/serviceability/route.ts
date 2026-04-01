import { type NextRequest, NextResponse } from "next/server"
import { ORDER_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"

export async function POST(request: NextRequest) {
  try {
    const { latitude, longitude } = await request.json()

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json({ message: "Latitude and longitude are required" }, { status: 400 })
    }

    return await proxyWithAuthRetry(request, {
      method: "POST",
      url: getEndpointUrl(ORDER_SERVICE_URL, "/service-zones/check-serviceability"),
      body: JSON.stringify({ latitude, longitude }),
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("Serviceability route error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
