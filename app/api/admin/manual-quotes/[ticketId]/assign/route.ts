import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { adminAssignManualQuote } from "@/lib/admin-manual-quote-service"
import {
  cleanNullableString,
  statusFromManualQuoteError,
} from "@/lib/admin-manual-quote-route-utils"

type RouteContext = {
  params: Promise<{ ticketId: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { ticketId } = await context.params
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const result = await adminAssignManualQuote(ticketId, {
    assignedAdminUserId: cleanNullableString(body.assignedAdminUserId),
  })

  if (!result.data) {
    return NextResponse.json(
      result.error ?? { message: "Failed to assign manual quote request" },
      { status: statusFromManualQuoteError(result.error) },
    )
  }

  revalidatePath("/admin/quotes")
  return NextResponse.json(result.data)
}
