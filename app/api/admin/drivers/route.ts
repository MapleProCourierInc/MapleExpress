import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { inviteAdminDriver } from "@/lib/admin-drivers-service"

function isValidDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const payload = {
    email: String(body?.email || "").trim().toLowerCase(),
    firstName: String(body?.firstName || "").trim(),
    lastName: String(body?.lastName || "").trim(),
    phone: String(body?.phone || "").trim(),
    dob: String(body?.dob || "").trim(),
    companyName: "MAPLEX_EXPRESS_INC",
    station: String(body?.station || "").trim(),
  }

  const required = ["email", "firstName", "lastName", "phone", "dob", "station"] as const
  const missing = required.filter((field) => !payload[field])
  const invalidDateOfBirth = Boolean(payload.dob) && !isValidDateOnly(payload.dob)

  if (missing.length || invalidDateOfBirth) {
    return NextResponse.json(
      {
        message: "Please complete all required fields.",
        errors: [
          ...missing.map((field) => ({ field, message: "Required" })),
          ...(invalidDateOfBirth ? [{ field: "dob", message: "Enter a valid date of birth" }] : []),
        ],
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
