import { type NextRequest, NextResponse } from "next/server"
import { cognitoRequest, getCognitoClientId } from "@/lib/cognito"

type CognitoConfirmSignUpResponse = Record<string, never>

const getFriendlyErrorMessage = (errorType: string, fallback: string) => {
  if (errorType.includes("CodeMismatchException")) {
    return "The confirmation code is invalid. Please try again."
  }
  if (errorType.includes("ExpiredCodeException")) {
    return "The confirmation code has expired. Please request a new code."
  }
  if (errorType.includes("TooManyFailedAttemptsException")) {
    return "Too many failed attempts. Please request a new code."
  }
  if (errorType.includes("LimitExceededException")) {
    return "Too many attempts. Please wait a moment before trying again."
  }
  if (errorType.includes("UserNotFoundException")) {
    return "We couldn't find an account for this email."
  }

  return fallback
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json({ message: "Email and confirmation code are required." }, { status: 400 })
    }

    const cognitoResponse = await cognitoRequest<CognitoConfirmSignUpResponse>(
      "AWSCognitoIdentityProviderService.ConfirmSignUp",
      {
        ClientId: getCognitoClientId(),
        Username: email,
        ConfirmationCode: code,
      },
    )

    if (!cognitoResponse.ok) {
      const errorType = cognitoResponse.error.__type || ""
      return NextResponse.json(
        {
          message: getFriendlyErrorMessage(
            errorType,
            cognitoResponse.error.message || "Unable to confirm email.",
          ),
        },
        { status: cognitoResponse.status },
      )
    }

    return NextResponse.json({ success: true, message: "Email confirmed successfully." }, { status: 200 })
  } catch (error) {
    console.error("Confirm signup error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
