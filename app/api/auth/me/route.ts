import { NextResponse } from "next/server"
import { getMe } from "@/src/lib/api/me"

export async function GET() {
  try {
    const me = await getMe()
    return NextResponse.json(me)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch profile"
    return NextResponse.json({ message }, { status: 401 })
  }
}
