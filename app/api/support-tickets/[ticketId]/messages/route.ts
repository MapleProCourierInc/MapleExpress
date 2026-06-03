import { type NextRequest, NextResponse } from "next/server"
import { ORDER_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"

type RouteContext = {
  params: Promise<{
    ticketId: string
  }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { ticketId } = await context.params
    const body = await request.json()

    return await proxyWithAuthRetry(request, {
      method: "POST",
      url: getEndpointUrl(
        ORDER_SERVICE_URL,
        `/api/v1/support-tickets/${encodeURIComponent(ticketId)}/messages`,
      ),
      body: JSON.stringify(body),
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("Add support ticket message error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
