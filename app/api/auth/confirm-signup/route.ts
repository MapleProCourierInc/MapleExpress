import { NextRequest, NextResponse } from "next/server"
import { cognitoConfirmSignUp } from "@/lib/auth/cognito-server"

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()
    if (!email || !code) {
      return NextResponse.json({ message: "Email and code are required" }, { status: 400 })
    }

    await cognitoConfirmSignUp(email, code)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Confirmation failed"
    return NextResponse.json({ message }, { status: 400 })
  }
}
