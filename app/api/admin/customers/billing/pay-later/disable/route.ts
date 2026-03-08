import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const ownerType = String(body?.ownerType || "").trim().toUpperCase()
  const ownerId = String(body?.ownerId || "").trim()

  if (!["INDIVIDUAL", "ORGANIZATION"].includes(ownerType) || !ownerId) {
    return NextResponse.json({ message: "ownerType and ownerId are required" }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    message: "Dummy endpoint: monthly billing disable request accepted.",
    ownerType,
    ownerId,
  })
}
