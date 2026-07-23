import { NextResponse } from "next/server"
import { getPublicPlatformContactConfiguration } from "@/lib/public-platform-configuration-service"
import { publicPlatformConfigErrorResponse } from "@/app/api/platform-configuration/_utils"

export async function GET() {
  const result = await getPublicPlatformContactConfiguration()
  if (!result.data) return publicPlatformConfigErrorResponse(result, "Failed to fetch contact configuration")
  return NextResponse.json(result.data)
}
