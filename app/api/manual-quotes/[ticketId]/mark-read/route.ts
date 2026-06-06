import { type NextRequest, NextResponse } from "next/server"
import { ORDER_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"

type RouteContext = {
  params: Promise<{
    ticketId: string
  }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { ticketId } = await context.params

    return await proxyWithAuthRetry(request, {
      method: "PATCH",
      url: getEndpointUrl(
        ORDER_SERVICE_URL,
        `/api/v1/manual-quotes/${encodeURIComponent(ticketId)}/mark-read`,
      ),
    })
  } catch (error) {
    console.error("Mark manual quote read error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
