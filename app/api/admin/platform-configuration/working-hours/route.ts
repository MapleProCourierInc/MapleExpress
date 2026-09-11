import { NextResponse } from "next/server"
import { platformConfigErrorResponse } from "@/app/api/admin/platform-configuration/_utils"
import { getAdminWorkingHours } from "@/lib/admin-platform-configuration-service"

export async function GET() {
  const result = await getAdminWorkingHours()
  if (!result.data) return platformConfigErrorResponse(result, "Failed to fetch working hours")
  return NextResponse.json(result.data)
}
