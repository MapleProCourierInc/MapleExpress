import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { archiveAdminPlatformLegalDocument } from "@/lib/admin-platform-configuration-service"
import { platformConfigErrorResponse } from "@/app/api/admin/platform-configuration/_utils"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ legalDocumentId: string }> },
) {
  const { legalDocumentId } = await params
  const result = await archiveAdminPlatformLegalDocument(legalDocumentId)

  if (!result.data) return platformConfigErrorResponse(result, "Failed to archive legal document")

  revalidatePath("/admin/platform-configuration")
  return NextResponse.json(result.data)
}
