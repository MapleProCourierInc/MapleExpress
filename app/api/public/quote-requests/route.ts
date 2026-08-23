import { type NextRequest, NextResponse } from "next/server"
import {
  submitPublicQuoteRequest,
  type PublicQuoteRequest,
} from "@/lib/public-quote-request-service"

function problem(status: number, title: string, detail: string) {
  return NextResponse.json(
    {
      type: "about:blank",
      title,
      status,
      detail,
    },
    {
      status,
      headers: { "Content-Type": "application/problem+json" },
    },
  )
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return problem(400, "Invalid quote request", "A valid quote request is required.")
  }

  try {
    const forwardedFor = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip")
    const response = await submitPublicQuoteRequest(
      body as PublicQuoteRequest,
      forwardedFor,
    )
    const responseHeaders = new Headers()
    const contentType = response.headers.get("content-type")
    const retryAfter = response.headers.get("retry-after")

    if (contentType) responseHeaders.set("Content-Type", contentType)
    if (retryAfter) responseHeaders.set("Retry-After", retryAfter)

    return new NextResponse(await response.text(), {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error("Public quote request error:", error)
    return problem(
      502,
      "Quote request delivery failed",
      "The quote request could not be delivered. Please try again later.",
    )
  }
}
