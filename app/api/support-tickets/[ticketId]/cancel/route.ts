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
    const body = await request.text().catch(() => "")
    const trimmedBody = body.trim()

    return await proxyWithAuthRetry(request, {
      method: "PATCH",
      url: getEndpointUrl(
        ORDER_SERVICE_URL,
        `/api/v1/support-tickets/${encodeURIComponent(ticketId)}/cancel`,
      ),
      ...(trimmedBody ? { body: trimmedBody, contentTypeJson: true } : {}),
    })
  } catch (error) {
    console.error("Cancel support ticket error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
