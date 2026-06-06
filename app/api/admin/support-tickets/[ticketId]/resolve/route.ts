import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { adminResolveSupportTicket } from "@/lib/admin-support-ticket-service"
import type { SupportTicketApiError } from "@/types/admin-support-tickets"

type RouteContext = {
  params: Promise<{ ticketId: string }>
}

function statusFrom(error: SupportTicketApiError | null) {
  return Number(error?.status) || 400
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { ticketId } = await context.params
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const resolutionSummary = String(body.resolutionSummary || "").trim()
  const messageToCustomer = String(body.messageToCustomer || "").trim()

  if (!resolutionSummary) {
    return NextResponse.json(
      {
        message: "Resolution summary is required",
        errors: [{ field: "resolutionSummary", message: "Resolution summary is required" }],
      },
      { status: 400 },
    )
  }

  const result = await adminResolveSupportTicket(ticketId, {
    resolutionSummary,
    messageToCustomer: messageToCustomer || null,
  })

  if (!result.data) {
    return NextResponse.json(result.error ?? { message: "Failed to resolve ticket" }, { status: statusFrom(result.error) })
  }

  revalidatePath("/admin/support")
  return NextResponse.json(result.data)
}
