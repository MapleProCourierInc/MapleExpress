import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { adminSendManualQuoteMessage } from "@/lib/admin-manual-quote-service"
import { statusFromManualQuoteError } from "@/lib/admin-manual-quote-route-utils"

type RouteContext = {
  params: Promise<{ ticketId: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { ticketId } = await context.params
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const message = String(body.message || "").trim()

  if (!message) {
    return NextResponse.json(
      { message: "Message is required", errors: [{ field: "message", message: "Message is required" }] },
      { status: 400 },
    )
  }

  const result = await adminSendManualQuoteMessage(ticketId, {
    message,
    attachments: Array.isArray(body.attachments) ? body.attachments : [],
  })

  if (!result.data) {
    return NextResponse.json(
      result.error ?? { message: "We could not send your message." },
      { status: statusFromManualQuoteError(result.error) },
    )
  }

  revalidatePath("/admin/quotes")
  return NextResponse.json(result.data)
}
