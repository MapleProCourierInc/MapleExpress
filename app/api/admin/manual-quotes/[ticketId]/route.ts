import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import {
  adminGetManualQuoteDetail,
  adminUpdateManualQuoteTicket,
} from "@/lib/admin-manual-quote-service"
import {
  cleanOptionalString,
  statusFromManualQuoteError,
} from "@/lib/admin-manual-quote-route-utils"
import {
  ADMIN_MANUAL_QUOTE_PRIORITIES,
  ADMIN_MANUAL_QUOTE_TICKET_STATUSES,
  type AdminUpdateManualQuoteTicketRequest,
} from "@/types/admin-manual-quotes"

type RouteContext = {
  params: Promise<{ ticketId: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { ticketId } = await context.params
  const result = await adminGetManualQuoteDetail(ticketId)

  if (!result.data) {
    return NextResponse.json(
      result.error ?? { message: "We could not load this quote request." },
      { status: statusFromManualQuoteError(result.error) },
    )
  }

  return NextResponse.json(result.data)
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { ticketId } = await context.params
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const payload: AdminUpdateManualQuoteTicketRequest = {}
  const errors: Array<{ field: string; message: string }> = []

  if (body.status !== undefined) {
    const status = String(body.status || "").trim() as NonNullable<AdminUpdateManualQuoteTicketRequest["status"]>
    if (!ADMIN_MANUAL_QUOTE_TICKET_STATUSES.includes(status)) {
      errors.push({ field: "status", message: "Select a valid status" })
    } else {
      payload.status = status
    }
  }

  if (body.priority !== undefined) {
    const priority = String(body.priority || "").trim() as NonNullable<AdminUpdateManualQuoteTicketRequest["priority"]>
    if (!ADMIN_MANUAL_QUOTE_PRIORITIES.includes(priority)) {
      errors.push({ field: "priority", message: "Select a valid priority" })
    } else {
      payload.priority = priority
    }
  }

  if (body.assignedAdminUserId !== undefined) {
    payload.assignedAdminUserId = cleanOptionalString(body.assignedAdminUserId) ?? null
  }

  if (errors.length) {
    return NextResponse.json({ message: "Please review manual quote metadata.", errors }, { status: 400 })
  }

  const result = await adminUpdateManualQuoteTicket(ticketId, payload)
  if (!result.data) {
    return NextResponse.json(
      result.error ?? { message: "Failed to update manual quote request" },
      { status: statusFromManualQuoteError(result.error) },
    )
  }

  revalidatePath("/admin/quotes")
  return NextResponse.json(result.data)
}
