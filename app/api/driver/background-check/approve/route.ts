import { revalidatePath } from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import { reviewDriverBackgroundCheck } from "@/lib/admin-drivers-service"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const driverId = String(body?.driverId || "").trim()
  const documentId = String(body?.documentId || "").trim()
  const action = String(body?.action || "APPROVED").trim().toUpperCase()
  const isValidAction = action === "APPROVED" || action === "REJECTED"
  const reason = String(body?.reason || (action === "REJECTED" ? "" : "Approved by admin")).trim()
  const notes = body?.notes ? String(body.notes).trim() : ""

  if (!driverId || !documentId || !isValidAction || (action === "REJECTED" && !reason)) {
    return NextResponse.json(
      {
        message: "driverId, documentId, and a valid action are required",
        errors: [
          ...(!driverId ? [{ field: "driverId", message: "driverId is required" }] : []),
          ...(!documentId ? [{ field: "documentId", message: "documentId is required" }] : []),
          ...(!isValidAction ? [{ field: "action", message: "action must be APPROVED or REJECTED" }] : []),
          ...(action === "REJECTED" && !reason ? [{ field: "reason", message: "reason is required when rejecting" }] : []),
        ],
      },
      { status: 400 },
    )
  }

  const reviewAction = action as "APPROVED" | "REJECTED"
  const result = await reviewDriverBackgroundCheck(driverId, {
    documentId,
    action: reviewAction,
    reason,
    notes,
  })

  if (!result.data) {
    if (result.textError) {
      return new NextResponse(result.textError, { status: 422, headers: { "Content-Type": "text/plain" } })
    }
    return NextResponse.json(result.error ?? { message: "Background check review failed" }, { status: Number(result.error?.status) || 400 })
  }

  revalidatePath("/admin/drivers")
  revalidatePath(`/admin/drivers/${driverId}`)

  return NextResponse.json({
    ...result.data,
    message: result.data?.message || (reviewAction === "APPROVED" ? "Background check approved successfully" : "Background check rejected successfully"),
  })
}
