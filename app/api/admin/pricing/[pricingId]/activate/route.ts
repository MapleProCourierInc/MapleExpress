import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { activateAdminPricingModel } from "@/lib/admin-pricing-service"

export async function POST(_request: Request, { params }: { params: Promise<{ pricingId: string }> }) {
  const { pricingId } = await params
  const result = await activateAdminPricingModel(pricingId)
  if (!result.data) return NextResponse.json(result.error ?? { message: "Failed to activate pricing model" }, { status: Number(result.error?.status) || 400 })
  revalidatePath("/admin/pricing")
  return NextResponse.json(result.data)
}
