import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { updateAdminPlatformSocialMediaConfiguration } from "@/lib/admin-platform-configuration-service"
import { platformConfigErrorResponse } from "@/app/api/admin/platform-configuration/_utils"
import type { UpdateSocialMediaConfigurationRequest } from "@/types/admin-platform-configuration"

export async function PUT(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as UpdateSocialMediaConfigurationRequest
  const result = await updateAdminPlatformSocialMediaConfiguration({
    profiles: body.profiles && typeof body.profiles === "object" ? body.profiles : {},
  })

  if (!result.data) return platformConfigErrorResponse(result, "Failed to update social-media configuration")

  revalidatePath("/admin/platform-configuration")
  return NextResponse.json(result.data)
}
