import { type NextRequest, NextResponse } from "next/server"
import { ORDER_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"

type RouteContext = {
  params: Promise<{
    ticketId: string
    quoteId: string
  }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { ticketId, quoteId } = await context.params
    const body = await request.json().catch(() => ({}))

    return await proxyWithAuthRetry(request, {
      method: "POST",
      url: getEndpointUrl(
        ORDER_SERVICE_URL,
        `/api/v1/manual-quotes/${encodeURIComponent(ticketId)}/quote-offers/${encodeURIComponent(quoteId)}/accept`,
      ),
      body: JSON.stringify(body),
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("Accept manual quote offer error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
