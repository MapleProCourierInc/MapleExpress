import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import {
  deleteAdminPlatformLegalDocumentDraft,
  updateAdminPlatformLegalDocumentDraft,
} from "@/lib/admin-platform-configuration-service"
import { platformConfigErrorResponse, validationError } from "@/app/api/admin/platform-configuration/_utils"
import type { UpdateLegalDocumentDraftRequest } from "@/types/admin-platform-configuration"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ legalDocumentId: string }> },
) {
  const { legalDocumentId } = await params
  const body = (await request.json().catch(() => ({}))) as UpdateLegalDocumentDraftRequest
  const hasEditableValue = ["title", "documentUrl", "changeSummary"].some((field) =>
    Object.prototype.hasOwnProperty.call(body, field),
  )

  if (!hasEditableValue) {
    return validationError("Please provide at least one draft field to update.", [
      { field: "title", message: "Title, document URL, or change summary is required" },
    ])
  }

  const result = await updateAdminPlatformLegalDocumentDraft(legalDocumentId, body)
  if (!result.data) return platformConfigErrorResponse(result, "Failed to update legal-document draft")

  revalidatePath("/admin/platform-configuration")
  return NextResponse.json(result.data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ legalDocumentId: string }> },
) {
  const { legalDocumentId } = await params
  const result = await deleteAdminPlatformLegalDocumentDraft(legalDocumentId)
  if (result.error) return platformConfigErrorResponse(result, "Failed to delete legal-document draft")

  revalidatePath("/admin/platform-configuration")
  return new NextResponse(null, { status: 204 })
}
