import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { enablePayLater } from "@/lib/admin-customer-billing-service"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const ownerType = String(body?.ownerType || "").trim().toUpperCase()
  const ownerId = String(body?.ownerId || "").trim()
  const reason = String(body?.reason || "").trim()
  const rawCreditLimit = body?.creditLimit
  const creditLimit =
    rawCreditLimit === null ||
    rawCreditLimit === undefined ||
    (typeof rawCreditLimit === "string" && rawCreditLimit.trim() === "")
      ? Number.NaN
      : Number(rawCreditLimit)
  const notes = body?.notes ? String(body.notes).trim() : ""

  if (!["INDIVIDUAL", "ORGANIZATION"].includes(ownerType)) {
    return NextResponse.json({ message: "ownerType must be INDIVIDUAL or ORGANIZATION" }, { status: 400 })
  }

  if (!ownerId || !reason || !Number.isFinite(creditLimit) || creditLimit < 0) {
    return NextResponse.json(
      {
        message: "ownerId, reason, and creditLimit are required",
        errors: [
          ...(!ownerId ? [{ field: "ownerId", message: "Required" }] : []),
          ...(!reason ? [{ field: "reason", message: "Required" }] : []),
          ...(!Number.isFinite(creditLimit) || creditLimit < 0
            ? [{ field: "creditLimit", message: "Credit limit must be 0 or greater" }]
            : []),
        ],
      },
      { status: 400 },
    )
  }

  const result = await enablePayLater({
    ownerType: ownerType as "INDIVIDUAL" | "ORGANIZATION",
    ownerId,
    reason,
    creditLimit,
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
