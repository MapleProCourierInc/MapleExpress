import { type NextRequest, NextResponse } from "next/server"
import { PROFILE_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"

async function getJsonResponse(response: Response) {
  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  try {
    const { addressId } = await params
    const addressData = await request.json()

    const response = await proxyWithAuthRetry(request, {
      method: "PATCH",
      url: getEndpointUrl(PROFILE_SERVICE_URL, `/profile/addresses/${addressId}`),
      body: JSON.stringify(addressData),
      contentTypeJson: true,
    })

    const parsed = await getJsonResponse(response)

    return NextResponse.json(parsed ?? {}, { status: response.status })
  } catch (error) {
    console.error("Update address error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  try {
    const { addressId } = await params

    const response = await proxyWithAuthRetry(request, {
      method: "DELETE",
      url: getEndpointUrl(PROFILE_SERVICE_URL, `/profile/addresses/${addressId}`),
    })

    if (response.status === 204) {
      return NextResponse.json({ success: true }, { status: 200 })
    }

    const parsed = await getJsonResponse(response)

    return NextResponse.json(parsed ?? {}, { status: response.status })
  } catch (error) {
    console.error("Delete address error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
