import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { adminCloseManualQuote } from "@/lib/admin-manual-quote-service"
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
  const result = await adminCloseManualQuote(ticketId, {
    reason: cleanNullableString(body.reason),
  })

  if (!result.data) {
    return NextResponse.json(
      result.error ?? { message: "Action failed. Please try again." },
      { status: statusFromManualQuoteError(result.error) },
    )
  }

  revalidatePath("/admin/quotes")
  return NextResponse.json(result.data)
}
