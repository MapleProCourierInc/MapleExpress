import { type NextRequest, NextResponse } from "next/server"
import { PRICING_PAYMENT_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    return await proxyWithAuthRetry(request, {
      method: "POST",
      url: getEndpointUrl(PRICING_PAYMENT_SERVICE_URL, "payments/checkout"),
      body: JSON.stringify(body),
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("Checkout payment error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
