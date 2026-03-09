import { NextResponse } from "next/server"

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 })
  const isSecure = process.env.NODE_ENV === "production"
  const cookieOptions = {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  }

  response.cookies.set("maplexpress_access_token", "", cookieOptions)
  response.cookies.set("accessToken", "", cookieOptions)
  response.cookies.set("maplexpress_refresh_token", "", cookieOptions)
  response.cookies.set("maplexpress_id_token", "", cookieOptions)

  return response
}
