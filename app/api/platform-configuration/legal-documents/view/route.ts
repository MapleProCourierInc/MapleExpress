import { NextRequest, NextResponse } from "next/server"
import { presignInternalView } from "@/lib/aws-integration-service"

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key")?.trim() || ""

  if (!key) {
    return NextResponse.json({ message: "key is required" }, { status: 400 })
  }

  if (!key.startsWith("legalDocuments/")) {
    return NextResponse.json({ message: "Only legal document keys can be viewed from this route" }, { status: 400 })
  }

  const presigned = await presignInternalView([key])
  const item = presigned[key]

  if (!item?.presignedGetUrl) {
    return NextResponse.json(
      { message: "Unable to generate a legal document view URL" },
      { status: 503 },
    )
  }

  return NextResponse.json(item)
}
