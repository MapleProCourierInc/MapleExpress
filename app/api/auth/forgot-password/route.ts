import { type NextRequest, NextResponse } from "next/server"
import { cognitoRequest, getCognitoClientId } from "@/lib/cognito"

type CognitoForgotPasswordResponse = {
  CodeDeliveryDetails?: {
    AttributeName?: string
    DeliveryMedium?: string
    Destination?: string
  }
}

const getFriendlyErrorMessage = (errorType: string, fallback: string) => {
  if (errorType.includes("UserNotFoundException")) {
    return "We couldn't find an account for this email."
  }
  if (errorType.includes("LimitExceededException")) {
    return "Too many attempts. Please wait a moment before trying again."
  }
  if (errorType.includes("TooManyRequestsException")) {
    return "Too many requests. Please wait a moment before trying again."
  }
  if (errorType.includes("InvalidParameterException")) {
    return "Please enter a valid email address."
  }

  return fallback
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 })
    }

    const cognitoResponse = await cognitoRequest<CognitoForgotPasswordResponse>(
      "AWSCognitoIdentityProviderService.ForgotPassword",
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
            cognitoResponse.error.message || "Unable to send reset code.",
          ),
        },
        { status: cognitoResponse.status },
      )
    }

    return NextResponse.json(
      { success: true, message: "Reset code sent successfully." },
      { status: 200 },
    )
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
