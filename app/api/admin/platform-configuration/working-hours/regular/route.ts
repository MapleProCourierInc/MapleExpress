import { revalidatePath } from "next/cache"
import { type NextRequest, NextResponse } from "next/server"
import { platformConfigErrorResponse, validationError } from "@/app/api/admin/platform-configuration/_utils"
import { updateAdminRegularWorkingHours } from "@/lib/admin-platform-configuration-service"
import { WORKING_HOURS_DAYS, type UpdateRegularWorkingHoursRequest } from "@/types/working-hours"

export async function PUT(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as UpdateRegularWorkingHoursRequest | null
  const regularHours = body?.regularHours
  if (!regularHours || WORKING_HOURS_DAYS.some((day) => !regularHours[day])) {
    return validationError("Please provide working hours for all seven days.", [
      { field: "regularHours", message: "Monday through Sunday are required" },
    ])
  }

  const result = await updateAdminRegularWorkingHours({ regularHours })
  if (!result.data) return platformConfigErrorResponse(result, "Failed to update regular working hours")

  revalidatePath("/admin/platform-configuration")
  return NextResponse.json(result.data)
}
