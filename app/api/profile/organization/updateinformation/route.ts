import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PROFILE_SERVICE_URL, getEndpointUrl } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      registrationNumber,
      taxID,
      industry,
      phone,
      website,
      pointOfContact,
    } = body;

    if (!userId) {
      return NextResponse.json({ message: "userId is required" }, { status: 400 });
    }

    const cookieStore = cookies();
    const token =
      cookieStore.get("accessToken")?.value || cookieStore.get("maplexpress_access_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const endpoint = getEndpointUrl(
      PROFILE_SERVICE_URL,
      `/profile/organization/user/${userId}`,
    );

    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Language": "application/json",
        "X-Real-IP": request.headers.get("x-forwarded-for") || "127.0.0.1",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        registrationNumber,
        taxId: taxID,
        industry,
        phone,
        websiteUrl: website,
        pointOfContactName: pointOfContact?.name,
        pointOfContactPosition: pointOfContact?.position,
        pointOfContactEmail: pointOfContact?.email,
        pointOfContactPhone: pointOfContact?.phone,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Update organization information error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
