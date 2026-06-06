import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import {
  adminGetSupportTicket,
  adminUpdateSupportTicket,
} from "@/lib/admin-support-ticket-service"
import {
  SUPPORT_TICKET_CATEGORIES,
  SUPPORT_TICKET_PRIORITIES,
  SUPPORT_TICKET_STATUSES,
  type AdminUpdateTicketRequest,
  type SupportTicketApiError,
} from "@/types/admin-support-tickets"

type RouteContext = {
  params: Promise<{ ticketId: string }>
}

function statusFrom(error: SupportTicketApiError | null) {
  return Number(error?.status) || 400
}

function cleanOptionalString(value: unknown) {
  if (value === null) return null
  const text = String(value ?? "").trim()
  return text || undefined
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { ticketId } = await context.params
  const result = await adminGetSupportTicket(ticketId)

  if (!result.data) {
    return NextResponse.json(result.error ?? { message: "Failed to fetch support ticket" }, { status: statusFrom(result.error) })
  }

  return NextResponse.json(result.data)
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { ticketId } = await context.params
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const payload: AdminUpdateTicketRequest = {}
  const errors: Array<{ field: string; message: string }> = []

  if (body.status !== undefined) {
    const status = String(body.status || "").trim() as NonNullable<AdminUpdateTicketRequest["status"]>
    if (!SUPPORT_TICKET_STATUSES.includes(status)) {
      errors.push({ field: "status", message: "Select a valid status" })
    } else {
      payload.status = status as AdminUpdateTicketRequest["status"]
    }
  }

  if (body.priority !== undefined) {
    const priority = String(body.priority || "").trim() as NonNullable<AdminUpdateTicketRequest["priority"]>
    if (!SUPPORT_TICKET_PRIORITIES.includes(priority)) {
      errors.push({ field: "priority", message: "Select a valid priority" })
    } else {
      payload.priority = priority as AdminUpdateTicketRequest["priority"]
    }
  }

  if (body.category !== undefined) {
    const category = String(body.category || "").trim() as NonNullable<AdminUpdateTicketRequest["category"]>
    if (!SUPPORT_TICKET_CATEGORIES.includes(category)) {
      errors.push({ field: "category", message: "Select a valid category" })
    } else {
      payload.category = category as AdminUpdateTicketRequest["category"]
    }
  }

  if (body.assignedAdminUserId !== undefined) {
    payload.assignedAdminUserId = cleanOptionalString(body.assignedAdminUserId) ?? null
  }

  if (errors.length) {
    return NextResponse.json({ message: "Please review ticket metadata.", errors }, { status: 400 })
  }

  const result = await adminUpdateSupportTicket(ticketId, payload)
  if (!result.data) {
    return NextResponse.json(result.error ?? { message: "Failed to update support ticket" }, { status: statusFrom(result.error) })
  }

  revalidatePath("/admin/support")
  return NextResponse.json(result.data)
}
