import { type NextRequest, NextResponse } from "next/server"
import { ORDER_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"

type RouteContext = {
  params: Promise<{
    ticketId: string
  }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { ticketId } = await context.params

    return await proxyWithAuthRetry(request, {
      method: "GET",
      url: getEndpointUrl(ORDER_SERVICE_URL, `/api/v1/manual-quotes/${encodeURIComponent(ticketId)}`),
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("Get manual quote detail error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
