import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { activateAdminPlatformLegalDocument } from "@/lib/admin-platform-configuration-service"
import { platformConfigErrorResponse } from "@/app/api/admin/platform-configuration/_utils"
import type { ActivateLegalDocumentRequest } from "@/types/admin-platform-configuration"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ legalDocumentId: string }> },
) {
  const { legalDocumentId } = await params
  const body = (await request.json().catch(() => ({}))) as ActivateLegalDocumentRequest
  const result = await activateAdminPlatformLegalDocument(legalDocumentId, body || {})

  if (!result.data) return platformConfigErrorResponse(result, "Failed to activate legal document")

  revalidatePath("/admin/platform-configuration")
  return NextResponse.json(result.data)
}
