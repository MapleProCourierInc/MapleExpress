import { type NextRequest, NextResponse } from "next/server"
import { cognitoRequest, getCognitoClientId } from "@/lib/cognito"

type CognitoConfirmForgotPasswordResponse = Record<string, never>

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
  if (errorType.includes("InvalidPasswordException")) {
    return "Password does not meet the required policy."
  }
  if (errorType.includes("UserNotFoundException")) {
    return "We couldn't find an account for this email."
  }

  return fallback
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code, password } = body

    if (!email || !code || !password) {
      return NextResponse.json(
        { message: "Email, confirmation code, and new password are required." },
        { status: 400 },
      )
    }

    const cognitoResponse = await cognitoRequest<CognitoConfirmForgotPasswordResponse>(
      "AWSCognitoIdentityProviderService.ConfirmForgotPassword",
      {
        ClientId: getCognitoClientId(),
        Username: email,
        ConfirmationCode: code,
        Password: password,
      },
    )

    if (!cognitoResponse.ok) {
      const errorType = cognitoResponse.error.__type || ""
      return NextResponse.json(
        {
          message: getFriendlyErrorMessage(
            errorType,
            cognitoResponse.error.message || "Unable to reset password.",
          ),
        },
        { status: cognitoResponse.status },
      )
    }

    return NextResponse.json({ success: true, message: "Password reset successfully." }, { status: 200 })
  } catch (error) {
    console.error("Confirm forgot password error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
