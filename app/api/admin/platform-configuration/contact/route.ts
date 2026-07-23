import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { updateAdminPlatformContactConfiguration } from "@/lib/admin-platform-configuration-service"
import { platformConfigErrorResponse, validationError } from "@/app/api/admin/platform-configuration/_utils"
import type { UpdateContactConfigurationRequest } from "@/types/admin-platform-configuration"

const REQUIRED_LOCATION_FIELDS = ["addressLine1", "city", "provinceOrState", "postalCode", "countryCode"] as const

export async function PUT(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Partial<UpdateContactConfigurationRequest>
  const errors: Array<{ field: string; message: string }> = []

  if (!body.location || typeof body.location !== "object") {
    errors.push({ field: "location", message: "Location is required" })
  } else {
    REQUIRED_LOCATION_FIELDS.forEach((field) => {
      if (!String(body.location?.[field] || "").trim()) {
        errors.push({ field: `location.${field}`, message: "Required" })
      }
    })
  }

  if (errors.length) {
    return validationError("Please review the contact configuration.", errors)
  }

  const result = await updateAdminPlatformContactConfiguration(body as UpdateContactConfigurationRequest)
  if (!result.data) return platformConfigErrorResponse(result, "Failed to update contact configuration")

  revalidatePath("/admin/platform-configuration")
  return NextResponse.json(result.data)
}
