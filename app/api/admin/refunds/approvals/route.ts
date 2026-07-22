import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { adminApproveRefunds } from "@/lib/admin-refund-service"
import type { AdminRefundApiError, BatchApprovalRequest } from "@/types/admin-refunds"

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
  const errors: Array<{ field: string; message: string }> = []

  const items: BatchApprovalRequest["items"] = rawItems.map((raw, index) => {
    const item = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
    const paymentId = cleanString(item.paymentId)
    const refundId = cleanString(item.refundId)
    const approvedTotalAmount =
      item.approvedTotalAmount === null || item.approvedTotalAmount === undefined || item.approvedTotalAmount === ""
        ? undefined
        : Number(item.approvedTotalAmount)

    if (!paymentId) errors.push({ field: `items.${index}.paymentId`, message: "Payment ID is required" })
    if (!refundId) errors.push({ field: `items.${index}.refundId`, message: "Refund ID is required" })
    if (approvedTotalAmount !== undefined && (!Number.isFinite(approvedTotalAmount) || approvedTotalAmount <= 0)) {
      errors.push({ field: `items.${index}.approvedTotalAmount`, message: "Approved amount must be greater than zero" })
    }

    return {
      paymentId,
      refundId,
      approvedTotalAmount,
      reviewNotes: cleanString(item.reviewNotes) || undefined,
    }
  })

  if (!items.length) errors.push({ field: "items", message: "Select at least one refund to approve" })
  if (errors.length) return NextResponse.json({ message: "Please review selected approvals.", errors }, { status: 400 })

  const result = await adminApproveRefunds({ items })
  if (!result.data) {
    return NextResponse.json(result.error ?? { message: "Failed to approve refunds" }, { status: statusFrom(result.error) })
  }

  revalidatePath("/admin/refunds")
  return NextResponse.json(result.data)
}
