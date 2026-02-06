import { NextRequest, NextResponse } from "next/server"
import { cognitoForgotPasswordSubmit } from "@/lib/auth/cognito-server"

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json()
    if (!email || !code || !newPassword) {
      return NextResponse.json({ message: "Email, code, and newPassword are required" }, { status: 400 })
    }

    await cognitoForgotPasswordSubmit(email, code, newPassword)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Password reset failed"
    return NextResponse.json({ message }, { status: 400 })
  }
}
