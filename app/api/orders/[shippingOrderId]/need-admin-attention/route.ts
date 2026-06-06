import { type NextRequest, NextResponse } from "next/server"
import { ORDER_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"

type RouteContext = {
  params: Promise<{
    shippingOrderId: string
  }>
}

async function requestManualQuote(request: NextRequest, context: RouteContext) {
  try {
    const { shippingOrderId } = await context.params

    return await proxyWithAuthRetry(request, {
      method: "POST",
      url: getEndpointUrl(
        ORDER_SERVICE_URL,
        `/api/v1/shipping-orders/${encodeURIComponent(shippingOrderId)}/manual-quote-request`,
      ),
    })
  } catch (error) {
    console.error("Request admin quote error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  return requestManualQuote(request, context)
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return requestManualQuote(request, context)
}
