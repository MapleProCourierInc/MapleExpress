import { NextResponse } from "next/server"
import { publicPlatformConfigErrorResponse } from "@/app/api/platform-configuration/_utils"
import { getPublicFaqs } from "@/lib/public-platform-configuration-service"

export async function GET() {
  const result = await getPublicFaqs()
  if (!result.data) return publicPlatformConfigErrorResponse(result, "Failed to fetch FAQs")
  return NextResponse.json(result.data)
}
