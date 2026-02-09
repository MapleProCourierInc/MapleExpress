import { type NextRequest, NextResponse } from "next/server"
import { cognitoRequest, getCognitoClientId } from "@/lib/cognito"

type CognitoResendResponse = {
  CodeDeliveryDetails?: {
    Destination?: string
    DeliveryMedium?: string
    AttributeName?: string
  }
}

const getFriendlyErrorMessage = (errorType: string, fallback: string) => {
  if (errorType.includes("UserNotFoundException")) {
    return "We couldn't find an account for this email."
  }
  if (errorType.includes("InvalidParameterException")) {
    return "That email address is not valid."
  }
  if (errorType.includes("LimitExceededException")) {
    return "Too many requests. Please wait a moment before trying again."
  }
  return fallback
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate required fields
    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 })
    }

    const cognitoResponse = await cognitoRequest<CognitoResendResponse>(
      "AWSCognitoIdentityProviderService.ResendConfirmationCode",
      {
        ClientId: getCognitoClientId(),
        Username: email,
      },
    )

    if (!cognitoResponse.ok) {
      const errorType = cognitoResponse.error.__type || ""
      return NextResponse.json(
        {
          message: getFriendlyErrorMessage(
            errorType,
            cognitoResponse.error.message || "Unable to resend confirmation code.",
          ),
        },
        { status: cognitoResponse.status },
      )
    }

    return NextResponse.json(
      { success: true, message: "Confirmation code sent successfully." },
      { status: 200 },
    )
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
