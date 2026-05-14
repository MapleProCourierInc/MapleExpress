import { type NextRequest, NextResponse } from "next/server"
import { ORDER_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"

type RouteContext = {
  params: Promise<{
    shippingOrderId: string
  }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { shippingOrderId } = await context.params

    return await proxyWithAuthRetry(request, {
      method: "GET",
      url: getEndpointUrl(
        ORDER_SERVICE_URL,
        `/orders/my-orders/${encodeURIComponent(shippingOrderId)}`,
      ),
    })
  } catch (error) {
    console.error("Get customer order detail error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
