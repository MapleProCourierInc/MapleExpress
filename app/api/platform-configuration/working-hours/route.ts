import { NextResponse } from "next/server"
import { publicPlatformConfigErrorResponse } from "@/app/api/platform-configuration/_utils"
import { getPublicWorkingHours } from "@/lib/public-platform-configuration-service"

export async function GET() {
  const result = await getPublicWorkingHours()
  if (!result.data) return publicPlatformConfigErrorResponse(result, "Failed to fetch working hours")
  return NextResponse.json(result.data)
}
