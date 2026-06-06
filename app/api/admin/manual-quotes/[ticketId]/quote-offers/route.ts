import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { adminCreateManualQuoteOffer } from "@/lib/admin-manual-quote-service"
import { statusFromManualQuoteError } from "@/lib/admin-manual-quote-route-utils"
import type { AdminCreateManualQuoteOfferRequest } from "@/types/admin-manual-quotes"

type RouteContext = {
  params: Promise<{ ticketId: string }>
}

function isFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { ticketId } = await context.params
  const body = (await request.json().catch(() => ({}))) as Partial<AdminCreateManualQuoteOfferRequest>
  const errors: Array<{ field: string; message: string }> = []

  if (!Array.isArray(body.itemLines) || body.itemLines.length === 0) {
    errors.push({ field: "itemLines", message: "Add at least one quoted package" })
  } else {
    body.itemLines.forEach((line, index) => {
      if (!String(line?.orderItemId || "").trim()) {
        errors.push({ field: `itemLines.${index}.orderItemId`, message: "Select a package" })
      }
      if (!isFiniteNumber(line?.subtotal)) {
        errors.push({ field: `itemLines.${index}.subtotal`, message: "Package subtotal is required" })
      }
      if (!isFiniteNumber(line?.totalAmount)) {
        errors.push({ field: `itemLines.${index}.totalAmount`, message: "Package total is required" })
      }
    })
  }

  if (errors.length) {
    return NextResponse.json({ message: "Please check the quote amounts and packages.", errors }, { status: 400 })
  }

  const result = await adminCreateManualQuoteOffer(ticketId, body as AdminCreateManualQuoteOfferRequest)
  if (!result.data) {
    return NextResponse.json(
      result.error ?? { message: "We could not send this quote. Please check the amounts and try again." },
      { status: statusFromManualQuoteError(result.error) },
    )
  }

  revalidatePath("/admin/quotes")
  return NextResponse.json(result.data)
}
