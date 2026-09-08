import { revalidatePath } from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import { platformConfigErrorResponse, validationError } from "@/app/api/admin/platform-configuration/_utils"
import { deleteAdminFaq, updateAdminFaq } from "@/lib/admin-platform-configuration-service"
import type { UpdateFaqRequest } from "@/types/admin-platform-configuration"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ faqId: string }> }) {
  const { faqId } = await params
  const body = (await request.json().catch(() => ({}))) as UpdateFaqRequest
  const hasQuestion = Object.prototype.hasOwnProperty.call(body, "question")
  const hasAnswer = Object.prototype.hasOwnProperty.call(body, "answer")
  const errors: Array<{ field: string; message: string }> = []

  if (!hasQuestion && !hasAnswer) {
    return validationError("Please provide at least one FAQ field to update.", [
      { field: "question", message: "Question or answer is required" },
    ])
  }
  if (hasQuestion && !String(body.question || "").trim()) {
    errors.push({ field: "question", message: "Question cannot be blank" })
  }
  if (hasAnswer && !String(body.answer || "").trim()) {
    errors.push({ field: "answer", message: "Answer cannot be blank" })
  }
  if (errors.length) return validationError("Please review the FAQ.", errors)

  const payload: UpdateFaqRequest = {}
  if (hasQuestion) payload.question = String(body.question).trim()
  if (hasAnswer) payload.answer = String(body.answer).trim()

  const result = await updateAdminFaq(faqId, payload)
  if (!result.data) return platformConfigErrorResponse(result, "Failed to update FAQ")

  revalidatePath("/faq")
  revalidatePath("/admin/platform-configuration")
  return NextResponse.json(result.data)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ faqId: string }> }) {
  const { faqId } = await params
  const result = await deleteAdminFaq(faqId)
  if (result.error) return platformConfigErrorResponse(result, "Failed to delete FAQ")

  revalidatePath("/faq")
  revalidatePath("/admin/platform-configuration")
  return new NextResponse(null, { status: 204 })
}
