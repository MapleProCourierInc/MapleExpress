import { NextRequest, NextResponse } from "next/server"
import {
  getAdminBillingAccountById,
  updateAdminBillingAccountCreditLimit,
} from "@/lib/admin-customer-billing-service"

type RouteContext = {
  params: Promise<{ billingAccountId: string }>
}

function errorResponse(
  result: {
    error: { status?: string; message?: string } | null
    textError?: string | null
  },
  fallback: string,
) {
  const status = Number(result.error?.status) || 400
  return NextResponse.json(
    result.error ?? { message: result.textError || fallback },
    { status },
  )
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { billingAccountId } = await params
  const normalizedId = billingAccountId.trim()

  if (!normalizedId) {
    return NextResponse.json({ message: "Billing account ID is required" }, { status: 400 })
  }

  const result = await getAdminBillingAccountById(normalizedId)
  if (!result.data) return errorResponse(result, "Failed to load billing account")

  return NextResponse.json(result.data)
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { billingAccountId } = await params
  const normalizedId = billingAccountId.trim()
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const rawCreditLimit = body.creditLimit
  const creditLimit =
    typeof rawCreditLimit === "number"
      ? rawCreditLimit
      : String(rawCreditLimit ?? "").trim()
        ? Number(rawCreditLimit)
        : Number.NaN
  const reason = String(body.reason ?? "").trim()
  const rawMongoVersion = body.mongoVersion
  const mongoVersion =
    rawMongoVersion === null || rawMongoVersion === undefined || rawMongoVersion === ""
      ? undefined
      : Number(rawMongoVersion)
  const errors: Array<{ field: string; message: string }> = []

  if (!normalizedId) errors.push({ field: "billingAccountId", message: "Billing account ID is required" })
  if (!Number.isFinite(creditLimit) || creditLimit < 0) {
    errors.push({ field: "creditLimit", message: "Credit limit must be 0 or greater" })
  }
  if (!reason) errors.push({ field: "reason", message: "Reason is required" })
  if (reason.length > 500) errors.push({ field: "reason", message: "Reason cannot exceed 500 characters" })
  if (mongoVersion !== undefined && (!Number.isInteger(mongoVersion) || mongoVersion < 0)) {
    errors.push({ field: "mongoVersion", message: "Mongo version must be a non-negative integer" })
  }

  if (errors.length) {
    return NextResponse.json({ message: "Please review the credit limit update", errors }, { status: 400 })
  }

  const result = await updateAdminBillingAccountCreditLimit(normalizedId, {
    creditLimit,
    reason,
    ...(mongoVersion !== undefined ? { mongoVersion } : {}),
  })

  if (!result.data) return errorResponse(result, "Failed to update credit limit")
  return NextResponse.json(result.data)
}
