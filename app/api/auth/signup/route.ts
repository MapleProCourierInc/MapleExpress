import { NextRequest, NextResponse } from "next/server"
import { cognitoSignUp } from "@/lib/auth/cognito-server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    await cognitoSignUp(email, password)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign up failed"
    return NextResponse.json({ message }, { status: 400 })
  }
}
