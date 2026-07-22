import { NextRequest, NextResponse } from "next/server"
import { adminGetRefund } from "@/lib/admin-refund-service"
import type { AdminRefundApiError } from "@/types/admin-refunds"

function statusFrom(error: AdminRefundApiError | null) {
  return Number(error?.status) || 400
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ paymentId: string; refundId: string }> },
) {
  const { paymentId, refundId } = await params
  const result = await adminGetRefund(paymentId, refundId)

  if (!result.data) {
    return NextResponse.json(result.error ?? { message: "Failed to load refund detail" }, { status: statusFrom(result.error) })
  }

  return NextResponse.json(result.data)
}
