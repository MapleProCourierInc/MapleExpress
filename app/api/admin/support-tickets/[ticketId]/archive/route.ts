import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { adminArchiveSupportTicket } from "@/lib/admin-support-ticket-service"
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
  const reason = String(body.reason || "").trim()
  const result = await adminArchiveSupportTicket(ticketId, { reason: reason || null })

  if (!result.data) {
    return NextResponse.json(result.error ?? { message: "Failed to archive ticket" }, { status: statusFrom(result.error) })
  }

  revalidatePath("/admin/support")
  return NextResponse.json(result.data)
}
