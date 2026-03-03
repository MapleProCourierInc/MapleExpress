import { revalidatePath } from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import { approveDriverLicense } from "@/lib/admin-drivers-service"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const driverId = String(body?.driverId || "").trim()
  const licenseNumber = String(body?.licenseNumber || "").trim()
  const reason = String(body?.reason || "Approved by admin").trim()
  const notes = body?.notes ? String(body.notes).trim() : ""

  if (!driverId || !licenseNumber) {
    return NextResponse.json(
      {
        message: "driverId and licenseNumber are required",
        errors: [
          { field: "driverId", message: "driverId is required" },
          { field: "licenseNumber", message: "licenseNumber is required" },
        ],
      },
      { status: 400 },
    )
  }

  const result = await approveDriverLicense(driverId, {
    licenseNumber,
    reason,
    notes,
  })

  if (!result.data) {
    if (result.textError) {
      return new NextResponse(result.textError, { status: 422, headers: { "Content-Type": "text/plain" } })
    }
    return NextResponse.json(result.error ?? { message: "License approval failed" }, { status: Number(result.error?.status) || 400 })
  }

  revalidatePath("/admin/drivers")
  revalidatePath(`/admin/drivers/${driverId}`)

  return NextResponse.json({ message: "License approved successfully" })
}
