import { revalidatePath } from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import { platformConfigErrorResponse, validationError } from "@/app/api/admin/platform-configuration/_utils"
import { createAdminFaq, getAdminFaqs } from "@/lib/admin-platform-configuration-service"
import type { CreateFaqRequest } from "@/types/admin-platform-configuration"

export async function GET() {
  const result = await getAdminFaqs()
  if (!result.data) return platformConfigErrorResponse(result, "Failed to fetch FAQs")
  return NextResponse.json(result.data)
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Partial<CreateFaqRequest>
  const question = String(body.question || "").trim()
  const answer = String(body.answer || "").trim()
  const errors: Array<{ field: string; message: string }> = []

  if (!question) errors.push({ field: "question", message: "Question is required" })
  if (!answer) errors.push({ field: "answer", message: "Answer is required" })
  if (errors.length) return validationError("Please review the FAQ.", errors)

  const result = await createAdminFaq({ question, answer })
  if (!result.data) return platformConfigErrorResponse(result, "Failed to create FAQ")

  revalidatePath("/faq")
  revalidatePath("/admin/platform-configuration")
  return NextResponse.json(result.data, { status: 201 })
}
