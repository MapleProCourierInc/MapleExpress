import { revalidatePath } from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import { approveDriverWorkEligibilityDocument } from "@/lib/admin-drivers-service"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const driverId = String(body?.driverId || "").trim()
  const documentId = String(body?.documentId || "").trim()
  const reason = String(body?.reason || "Approved by admin").trim()
  const notes = body?.notes ? String(body.notes).trim() : ""

  if (!driverId || !documentId) {
    return NextResponse.json(
      {
        message: "driverId and documentId are required",
        errors: [
          { field: "driverId", message: "driverId is required" },
          { field: "documentId", message: "documentId is required" },
        ],
      },
      { status: 400 },
    )
  }

  const result = await approveDriverWorkEligibilityDocument(driverId, {
    documentId,
    reason,
    notes,
  })

  if (!result.data) {
    if (result.textError) {
      return new NextResponse(result.textError, { status: 422, headers: { "Content-Type": "text/plain" } })
    }
    return NextResponse.json(result.error ?? { message: "Work eligibility document approval failed" }, { status: Number(result.error?.status) || 400 })
  }

  revalidatePath("/admin/drivers")
  revalidatePath(`/admin/drivers/${driverId}`)

  return NextResponse.json({ message: "Proof of work document approved successfully" })
}
