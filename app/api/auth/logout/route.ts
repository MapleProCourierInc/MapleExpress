import { NextResponse } from "next/server"
import { COOKIE_NAMES, cookieSettings } from "@/lib/auth/session"

export async function POST() {
  const response = NextResponse.json({ ok: true })

  response.cookies.set(COOKIE_NAMES.access, "", { ...cookieSettings(0), maxAge: 0 })
  response.cookies.set(COOKIE_NAMES.id, "", { ...cookieSettings(0), maxAge: 0 })
  response.cookies.set(COOKIE_NAMES.refresh, "", { ...cookieSettings(0), maxAge: 0 })

  return response
}
