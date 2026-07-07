import { revalidatePath } from "next/cache"
import { type NextRequest, NextResponse } from "next/server"
import { assignDriverToOrderFulfillment } from "@/lib/admin-order-fulfillments-service"
import type { AssignDriverRequest } from "@/types/admin-order-fulfillments"

function normalizePayload(body: Record<string, unknown>): AssignDriverRequest {
  return {
    orderFulfilmentId: String(body.orderFulfilmentId || "").trim(),
    driverUserId: String(body.driverUserId || "").trim(),
    driverName: String(body.driverName || "").trim(),
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const payload = normalizePayload(body)

  const errors: Array<{ field: string; message: string }> = []
  if (!payload.orderFulfilmentId) errors.push({ field: "orderFulfilmentId", message: "Order fulfilment is required" })
  if (!payload.driverUserId) errors.push({ field: "driverUserId", message: "Driver user ID is required" })
  if (!payload.driverName) errors.push({ field: "driverName", message: "Driver name is required" })

  if (errors.length) {
    return NextResponse.json({ message: "Please review the assignment values.", errors }, { status: 400 })
  }

  const result = await assignDriverToOrderFulfillment(payload)

  if (!result.data) {
    if (result.textError) {
      return new NextResponse(result.textError, { status: 422, headers: { "Content-Type": "text/plain" } })
    }

    return NextResponse.json(result.error ?? { message: "Failed to assign driver" }, { status: Number(result.error?.status) || 400 })
  }

  revalidatePath("/admin/order-fulfillments")
  return NextResponse.json(result.data)
}
