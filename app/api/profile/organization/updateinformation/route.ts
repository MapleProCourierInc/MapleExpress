import { type NextRequest, NextResponse } from "next/server";
import { PROFILE_SERVICE_URL } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, registrationNumber, taxID, industry, phone, website, pointOfContact } = body;

    if (!userId) {
      return NextResponse.json({ message: "userId is required" }, { status: 400 });
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const endpoint = `${PROFILE_SERVICE_URL}/organization/updateinformation/${userId}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Language": "application/json",
        "X-Real-IP": request.headers.get("x-forwarded-for") || "127.0.0.1",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ registrationNumber, taxID, industry, phone, website, pointOfContact }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Update organization information error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
