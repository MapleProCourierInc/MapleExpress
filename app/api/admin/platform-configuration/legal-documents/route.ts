import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { createAdminPlatformLegalDocumentVersion } from "@/lib/admin-platform-configuration-service"
import { platformConfigErrorResponse, validationError } from "@/app/api/admin/platform-configuration/_utils"
import {
  LEGAL_DOCUMENT_TYPE_OPTIONS,
  type CreateLegalDocumentVersionRequest,
  type LegalDocumentType,
} from "@/types/admin-platform-configuration"

const LEGAL_DOCUMENT_TYPES = new Set(LEGAL_DOCUMENT_TYPE_OPTIONS.map((option) => option.value))

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Partial<CreateLegalDocumentVersionRequest>
  const errors: Array<{ field: string; message: string }> = []

  if (!body.documentType || !LEGAL_DOCUMENT_TYPES.has(body.documentType as LegalDocumentType)) {
    errors.push({ field: "documentType", message: "Select a valid legal-document type" })
  }
  if (!String(body.title || "").trim()) errors.push({ field: "title", message: "Title is required" })
  if (!String(body.documentUrl || "").trim()) errors.push({ field: "documentUrl", message: "Uploaded document key is required" })

  if (errors.length) {
    return validationError("Please review the legal-document draft.", errors)
  }

  const result = await createAdminPlatformLegalDocumentVersion(body as CreateLegalDocumentVersionRequest)
  if (!result.data) return platformConfigErrorResponse(result, "Failed to create legal-document draft")

  revalidatePath("/admin/platform-configuration")
  return NextResponse.json(result.data, { status: 201 })
}
