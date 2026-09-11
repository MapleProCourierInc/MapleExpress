import { revalidatePath } from "next/cache"
import { type NextRequest, NextResponse } from "next/server"
import { platformConfigErrorResponse, validationError } from "@/app/api/admin/platform-configuration/_utils"
import { deleteAdminSpecialWorkingHours, updateAdminSpecialWorkingHours } from "@/lib/admin-platform-configuration-service"
import type { UpdateSpecialWorkingHoursRequest } from "@/types/working-hours"

type RouteContext = { params: Promise<{ specialWorkingHoursId: string }> }

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { specialWorkingHoursId } = await params
  const body = (await request.json().catch(() => null)) as UpdateSpecialWorkingHoursRequest | null
  if (!body || Object.keys(body).length === 0) {
    return validationError("Provide at least one field to update.", [
      { field: "specialWorkingHours", message: "At least one field is required" },
    ])
  }

  const result = await updateAdminSpecialWorkingHours(specialWorkingHoursId, body)
  if (!result.data) return platformConfigErrorResponse(result, "Failed to update special working hours")

  revalidatePath("/admin/platform-configuration")
  return NextResponse.json(result.data)
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { specialWorkingHoursId } = await params
  const result = await deleteAdminSpecialWorkingHours(specialWorkingHoursId)
  if (result.error) return platformConfigErrorResponse(result, "Failed to delete special working hours")

  revalidatePath("/admin/platform-configuration")
  return new NextResponse(null, { status: 204 })
}
