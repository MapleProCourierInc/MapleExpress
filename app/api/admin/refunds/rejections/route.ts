import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { adminRejectRefunds } from "@/lib/admin-refund-service"
import type { AdminRefundApiError, BatchRejectionRequest } from "@/types/admin-refunds"

function statusFrom(error: AdminRefundApiError | null) {
  return Number(error?.status) || 400
}

function cleanString(value: unknown) {
  const text = String(value ?? "").trim()
  return text || ""
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const rawItems = Array.isArray(body.items) ? body.items : []
  const rejectionReason = cleanString(body.rejectionReason)
  const reviewNotes = cleanString(body.reviewNotes)
  const errors: Array<{ field: string; message: string }> = []

  const items: BatchRejectionRequest["items"] = rawItems.map((raw, index) => {
    const item = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
    const paymentId = cleanString(item.paymentId)
    const refundId = cleanString(item.refundId)

    if (!paymentId) errors.push({ field: `items.${index}.paymentId`, message: "Payment ID is required" })
    if (!refundId) errors.push({ field: `items.${index}.refundId`, message: "Refund ID is required" })

    return {
      paymentId,
      refundId,
      rejectionReason: cleanString(item.rejectionReason) || undefined,
      reviewNotes: cleanString(item.reviewNotes) || undefined,
    }
  })

  if (!items.length) errors.push({ field: "items", message: "Select at least one refund to reject" })
  if (!rejectionReason && !items.some((item) => item.rejectionReason)) {
    errors.push({ field: "rejectionReason", message: "A rejection reason is required" })
  }
  if (errors.length) return NextResponse.json({ message: "Please review selected rejections.", errors }, { status: 400 })

  const result = await adminRejectRefunds({
    items,
    rejectionReason: rejectionReason || undefined,
    reviewNotes: reviewNotes || undefined,
  })
  if (!result.data) {
    return NextResponse.json(result.error ?? { message: "Failed to reject refunds" }, { status: statusFrom(result.error) })
  }

  revalidatePath("/admin/refunds")
  return NextResponse.json(result.data)
}
