import { type NextRequest, NextResponse } from "next/server"
import { ORDER_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"

type RouteContext = {
  params: Promise<{
    shippingOrderId: string
  }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { shippingOrderId } = await context.params
    const body = await request.json()

    return await proxyWithAuthRetry(request, {
      method: "PATCH",
      url: getEndpointUrl(
        ORDER_SERVICE_URL,
        `/orders/${encodeURIComponent(shippingOrderId)}/need-admin-attention`,
      ),
      body: JSON.stringify(body),
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("Request admin quote error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
