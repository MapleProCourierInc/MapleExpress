import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { adminReplySupportTicket } from "@/lib/admin-support-ticket-service"
import type { SupportTicketApiError } from "@/types/admin-support-tickets"

type RouteContext = {
  params: Promise<{ ticketId: string }>
}

function statusFrom(error: SupportTicketApiError | null) {
  return Number(error?.status) || 400
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

  const result = await adminReplySupportTicket(ticketId, {
    message,
    attachments: Array.isArray(body.attachments) ? body.attachments : [],
  })

  if (!result.data) {
    return NextResponse.json(result.error ?? { message: "Failed to send reply" }, { status: statusFrom(result.error) })
  }

  revalidatePath("/admin/support")
  return NextResponse.json(result.data)
}
