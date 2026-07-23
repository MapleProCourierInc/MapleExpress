import { NextResponse } from "next/server"
import { getPublicPlatformConfiguration } from "@/lib/public-platform-configuration-service"
import { publicPlatformConfigErrorResponse } from "@/app/api/platform-configuration/_utils"

export async function GET() {
  const result = await getPublicPlatformConfiguration()
  if (!result.data) return publicPlatformConfigErrorResponse(result, "Failed to fetch platform configuration")
  return NextResponse.json(result.data)
}
