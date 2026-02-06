import { NextResponse } from "next/server"
import { getSessionFromCookies } from "@/lib/auth/session"

export async function GET() {
  const session = await getSessionFromCookies()

  return NextResponse.json({
    authenticated: session.authenticated,
    email: session.email,
    sub: session.sub,
    groups: session.groups,
  })
}
