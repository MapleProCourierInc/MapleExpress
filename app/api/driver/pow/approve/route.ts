import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  return NextResponse.json(
    {
      message: "Proof-of-work eligibility approval API placeholder created. Backend integration pending.",
      received: body,
    },
    { status: 501 },
  )
}
