import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { adminAddManualQuoteInternalNote } from "@/lib/admin-manual-quote-service"
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
      { message: "Internal note is required", errors: [{ field: "message", message: "Internal note is required" }] },
      { status: 400 },
    )
  }

  const result = await adminAddManualQuoteInternalNote(ticketId, {
    message,
    attachments: Array.isArray(body.attachments) ? body.attachments : [],
  })

  if (!result.data) {
    return NextResponse.json(
      result.error ?? { message: "We could not add this internal note." },
      { status: statusFromManualQuoteError(result.error) },
    )
  }

  revalidatePath("/admin/quotes")
  return NextResponse.json(result.data)
}
