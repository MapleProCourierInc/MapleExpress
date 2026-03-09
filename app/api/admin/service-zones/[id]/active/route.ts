import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { toggleServiceZoneActive } from "@/lib/admin-service-zones-service"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

  if (typeof body.active !== "boolean") {
    return NextResponse.json({ message: "active must be boolean" }, { status: 400 })
  }

  const result = await toggleServiceZoneActive(id, { active: body.active })
  if (!result.data) {
    return NextResponse.json(result.error ?? { message: "Failed to update service zone status" }, { status: Number(result.error?.status) || 400 })
  }

  revalidatePath("/admin/service-zones")
  return NextResponse.json(result.data)
}
