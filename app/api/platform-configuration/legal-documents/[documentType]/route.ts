import { NextResponse } from "next/server"
import {
  PUBLIC_LEGAL_DOCUMENT_TYPES,
  type PublicLegalDocumentType,
} from "@/types/platform-configuration"
import { getPublicPlatformLegalDocumentByType } from "@/lib/public-platform-configuration-service"
import { publicPlatformConfigErrorResponse } from "@/app/api/platform-configuration/_utils"

const DOCUMENT_TYPES = new Set(PUBLIC_LEGAL_DOCUMENT_TYPES)

export async function GET(_request: Request, { params }: { params: Promise<{ documentType: string }> }) {
  const { documentType } = await params
  const normalized = String(documentType || "").toUpperCase() as PublicLegalDocumentType

  if (!DOCUMENT_TYPES.has(normalized)) {
    return NextResponse.json({ message: "Unsupported legal document type" }, { status: 400 })
  }

  const result = await getPublicPlatformLegalDocumentByType(normalized)
  if (!result.data) return publicPlatformConfigErrorResponse(result, "Failed to fetch legal document")
  return NextResponse.json(result.data)
}
