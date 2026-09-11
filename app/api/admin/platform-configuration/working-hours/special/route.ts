import { revalidatePath } from "next/cache"
import { type NextRequest, NextResponse } from "next/server"
import { platformConfigErrorResponse, validationError } from "@/app/api/admin/platform-configuration/_utils"
import { createAdminSpecialWorkingHours } from "@/lib/admin-platform-configuration-service"
import type { CreateSpecialWorkingHoursRequest } from "@/types/working-hours"

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as CreateSpecialWorkingHoursRequest | null
  if (!body?.date || typeof body.closed !== "boolean") {
    return validationError("Please complete the special working-hours entry.", [
      { field: "date", message: "Date and closed status are required" },
    ])
  }

  const result = await createAdminSpecialWorkingHours(body)
  if (!result.data) return platformConfigErrorResponse(result, "Failed to create special working hours")

  revalidatePath("/admin/platform-configuration")
  return NextResponse.json(result.data, { status: 201 })
}
