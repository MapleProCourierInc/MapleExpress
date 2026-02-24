import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { inviteAdminDriver } from "@/lib/admin-drivers-service"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const payload = {
    email: String(body?.email || "").trim().toLowerCase(),
    firstName: String(body?.firstName || "").trim(),
    lastName: String(body?.lastName || "").trim(),
    phone: String(body?.phone || "").trim(),
    companyName: "MAPLEX_EXPRESS_INC",
    station: String(body?.station || "").trim(),
  }

  const required = ["email", "firstName", "lastName", "phone", "station"] as const
  const missing = required.filter((field) => !payload[field])

  if (missing.length) {
    return NextResponse.json(
      {
        message: "Please complete all required fields.",
        errors: missing.map((field) => ({ field, message: "Required" })),
      },
      { status: 400 },
    )
  }

  const result = await inviteAdminDriver(payload)

  if (!result.data) {
    const status = Number(result.error?.status) || 400
    return NextResponse.json(result.error ?? { message: "Failed to invite driver" }, { status })
  }

  revalidatePath("/admin/drivers")
  return NextResponse.json(result.data)
}
