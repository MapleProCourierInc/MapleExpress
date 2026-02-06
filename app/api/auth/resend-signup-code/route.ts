import { NextRequest, NextResponse } from "next/server"
import { cognitoResendSignUpCode } from "@/lib/auth/cognito-server"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 })
    }

    await cognitoResendSignUpCode(email)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to resend code"
    return NextResponse.json({ message }, { status: 400 })
  }
}
