import { NextResponse } from "next/server"
import { getPublicPlatformLegalDocuments } from "@/lib/public-platform-configuration-service"
import { publicPlatformConfigErrorResponse } from "@/app/api/platform-configuration/_utils"

export async function GET() {
  const result = await getPublicPlatformLegalDocuments()
  if (!result.data) return publicPlatformConfigErrorResponse(result, "Failed to fetch legal documents")
  return NextResponse.json(result.data)
}
