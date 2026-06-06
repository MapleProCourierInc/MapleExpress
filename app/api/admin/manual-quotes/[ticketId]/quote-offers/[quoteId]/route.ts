import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { adminUpdateManualQuoteOffer } from "@/lib/admin-manual-quote-service"
import {
  cleanOptionalString,
  statusFromManualQuoteError,
} from "@/lib/admin-manual-quote-route-utils"
import type { AdminUpdateManualQuoteOfferRequest } from "@/types/admin-manual-quotes"

type RouteContext = {
  params: Promise<{ ticketId: string; quoteId: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { ticketId, quoteId } = await context.params
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const payload: AdminUpdateManualQuoteOfferRequest = {}
  const errors: Array<{ field: string; message: string }> = []

  if (body.status !== undefined) {
    const status = String(body.status || "").trim()
    if (status !== "WITHDRAWN" && status !== "EXPIRED") {
      errors.push({ field: "status", message: "Offer status can only be WITHDRAWN or EXPIRED" })
    } else {
      payload.status = status
    }
  }

  if (body.title !== undefined) payload.title = cleanOptionalString(body.title) ?? undefined
  if (body.description !== undefined) payload.description = cleanOptionalString(body.description) ?? undefined
  if (body.expiresAt !== undefined) payload.expiresAt = cleanOptionalString(body.expiresAt) ?? null
  if (body.messageToCustomer !== undefined) payload.messageToCustomer = cleanOptionalString(body.messageToCustomer) ?? null
  if (body.metadata && typeof body.metadata === "object") payload.metadata = body.metadata as Record<string, unknown>

  if (errors.length) {
    return NextResponse.json({ message: "Please review quote offer update.", errors }, { status: 400 })
  }

  const result = await adminUpdateManualQuoteOffer(ticketId, quoteId, payload)
  if (!result.data) {
    return NextResponse.json(
      result.error ?? { message: "We could not update this quote offer." },
      { status: statusFromManualQuoteError(result.error) },
    )
  }

  revalidatePath("/admin/quotes")
  return NextResponse.json(result.data)
}
