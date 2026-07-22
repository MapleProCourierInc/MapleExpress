import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { adminCreateManualRefund } from "@/lib/admin-refund-service"
import type { AdminRefundApiError, ManualRefundRequest } from "@/types/admin-refunds"

function statusFrom(error: AdminRefundApiError | null) {
  return Number(error?.status) || 400
}

function cleanString(value: unknown) {
  const text = String(value ?? "").trim()
  return text || ""
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const errors: Array<{ field: string; message: string }> = []
  const paymentId = cleanString(body.paymentId)
  const amount = Number(body.amount)
  const idempotencyKey = cleanString(request.headers.get("Idempotency-Key")) || cleanString(body.idempotencyKey)

  if (!paymentId) errors.push({ field: "paymentId", message: "Payment ID is required" })
  if (!Number.isFinite(amount) || amount <= 0) errors.push({ field: "amount", message: "Refund amount must be greater than zero" })

  const metadata =
    body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
      ? (body.metadata as Record<string, unknown>)
      : undefined

  const payload: ManualRefundRequest = {
    paymentId,
    amount,
    currency: cleanString(body.currency) || undefined,
    reasonCode: cleanString(body.reasonCode) || undefined,
    customerFacingReason: cleanString(body.customerFacingReason) || undefined,
    internalReason: cleanString(body.internalReason) || undefined,
    trackingNumber: cleanString(body.trackingNumber) || undefined,
    shippingOrderId: cleanString(body.shippingOrderId) || undefined,
    idempotencyKey: idempotencyKey || undefined,
    metadata,
  }

  if (errors.length) return NextResponse.json({ message: "Please review the manual refund request.", errors }, { status: 400 })

  const result = await adminCreateManualRefund(payload, idempotencyKey)
  if (!result.data) {
    return NextResponse.json(result.error ?? { message: "Failed to create manual refund" }, { status: statusFrom(result.error) })
  }

  revalidatePath("/admin/refunds")
  return NextResponse.json(result.data)
}
