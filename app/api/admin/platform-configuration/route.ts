import { NextResponse } from "next/server"
import { getAdminPlatformConfiguration } from "@/lib/admin-platform-configuration-service"
import { platformConfigErrorResponse } from "@/app/api/admin/platform-configuration/_utils"

export async function GET() {
  const result = await getAdminPlatformConfiguration()
  if (!result.data) return platformConfigErrorResponse(result, "Failed to fetch platform configuration")
  return NextResponse.json(result.data)
}
