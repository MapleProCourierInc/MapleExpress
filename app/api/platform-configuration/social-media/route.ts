import { NextResponse } from "next/server"
import { getPublicPlatformSocialMediaProfiles } from "@/lib/public-platform-configuration-service"
import { publicPlatformConfigErrorResponse } from "@/app/api/platform-configuration/_utils"

export async function GET() {
  const result = await getPublicPlatformSocialMediaProfiles()
  if (!result.data) return publicPlatformConfigErrorResponse(result, "Failed to fetch social-media profiles")
  return NextResponse.json(result.data)
}
