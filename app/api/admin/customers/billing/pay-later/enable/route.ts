import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { enablePayLater } from "@/lib/admin-customer-billing-service"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const ownerType = String(body?.ownerType || "").trim().toUpperCase()
  const ownerId = String(body?.ownerId || "").trim()
  const reason = String(body?.reason || "").trim()
  const notes = body?.notes ? String(body.notes).trim() : ""

  if (!["INDIVIDUAL", "ORGANIZATION"].includes(ownerType)) {
    return NextResponse.json({ message: "ownerType must be INDIVIDUAL or ORGANIZATION" }, { status: 400 })
  }

  if (!ownerId || !reason) {
    return NextResponse.json(
      {
        message: "ownerId and reason are required",
        errors: [
          ...(!ownerId ? [{ field: "ownerId", message: "Required" }] : []),
          ...(!reason ? [{ field: "reason", message: "Required" }] : []),
        ],
      },
      { status: 400 },
    )
  }

  const result = await enablePayLater({
    ownerType: ownerType as "INDIVIDUAL" | "ORGANIZATION",
    ownerId,
    reason,
    notes,
  })

  if (!result.data) {
    if (result.textError) {
      return new NextResponse(result.textError, { status: Number(result.error?.status) || 422, headers: { "Content-Type": "text/plain" } })
    }

    return NextResponse.json(result.error ?? { message: "Failed to enable monthly billing" }, { status: Number(result.error?.status) || 400 })
  }

  revalidatePath("/admin/customers")
  revalidatePath(`/admin/customers/${ownerType.toLowerCase()}/${ownerId}`)

  return NextResponse.json(result.data)
}
