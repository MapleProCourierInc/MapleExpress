import { NextRequest, NextResponse } from "next/server"
import { presignUpload } from "@/lib/aws-integration-service"
import type { PresignV2Request, S3UploadType } from "@/types/aws-s3"

const LEGAL_UPLOAD_TYPES = new Set(["TERMS_AND_CONDITIONS", "PRIVACY_POLICY", "COOKIE_POLICY", "REFUND_POLICY"])

function errorResponse(result: { error: { status?: string; message?: string } | null; textError?: string | null }, fallback: string) {
  const status = Number(result.error?.status)
  const responseStatus = Number.isInteger(status) && status >= 400 ? status : 400

  if (result.textError) {
    return new NextResponse(result.textError, {
      status: responseStatus,
      headers: { "Content-Type": "text/plain" },
    })
  }

  return NextResponse.json(result.error ?? { message: fallback }, { status: responseStatus })
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Partial<PresignV2Request>
  const uploadType = String(body.uploadType || "").trim().toUpperCase() as S3UploadType

  if (!uploadType) {
    return NextResponse.json({ message: "uploadType is required" }, { status: 400 })
  }

  if (LEGAL_UPLOAD_TYPES.has(uploadType)) {
    const contentType = body.defaultContentType || body.files?.[0]?.contentType
    if (contentType !== "application/pdf") {
      return NextResponse.json({ message: "Legal document uploads must use application/pdf" }, { status: 400 })
    }
  }

  const payload: PresignV2Request = {
    ...body,
    uploadType,
    count: body.count ?? (body.files?.length ? undefined : 1),
  }

  const result = await presignUpload(payload)
  if (!result.data) return errorResponse(result, "Failed to generate upload URL")

  return NextResponse.json(result.data)
}
