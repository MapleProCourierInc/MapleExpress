import { NextRequest, NextResponse } from "next/server"
import { postAdminDriverAction } from "@/lib/admin-drivers-service"

const allowedActions = new Set(["approve", "reject", "suspend", "unsuspend", "terminate"])

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string; action: string }> },
) {
  const { driverId, action } = await params

  if (!allowedActions.has(action)) {
    return NextResponse.json({ message: "Unsupported action" }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  const reason = String(body?.reason || "").trim()
  const notes = body?.notes ? String(body.notes).trim() : ""

  if (!reason) {
    return NextResponse.json(
      {
        message: "Reason is required",
        errors: [{ field: "reason", message: "Reason is required" }],
      },
      { status: 400 },
    )
  }

  const result = await postAdminDriverAction(driverId, action as "approve" | "reject" | "suspend" | "unsuspend" | "terminate", {
    reason,
    notes,
  })

  if (!result.data) {
    if (result.textError) {
      return new NextResponse(result.textError, { status: 422, headers: { "Content-Type": "text/plain" } })
    }
    return NextResponse.json(result.error ?? { message: "Action failed" }, { status: Number(result.error?.status) || 400 })
  }

  return NextResponse.json(result.data)
}
