import { type NextRequest, NextResponse } from "next/server"
import { cognitoRequest } from "@/lib/cognito"
import { getAuthTokensFromRequest } from "@/lib/server-auth"

type CognitoChangePasswordResponse = Record<string, never>

const getFriendlyErrorMessage = (errorType: string, fallback: string) => {
  if (errorType.includes("NotAuthorizedException")) {
    return "Your current password is incorrect or your session has expired."
  }
  if (errorType.includes("InvalidPasswordException")) {
    return "The new password does not meet the required password policy."
  }
  if (errorType.includes("LimitExceededException") || errorType.includes("TooManyRequestsException")) {
    return "Too many attempts. Please wait a moment and try again."
  }
  if (errorType.includes("PasswordResetRequiredException")) {
    return "A password reset is required before you can change your password."
  }
  if (errorType.includes("UserNotConfirmedException")) {
    return "Please confirm your account before changing your password."
  }
  return fallback
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 })
    }

    const accessToken = getAuthTokensFromRequest(request).accessToken
    if (!accessToken) {
      return NextResponse.json({ message: "Authentication is required" }, { status: 401 })
    }

    const cognitoResponse = await cognitoRequest<CognitoChangePasswordResponse>(
      "AWSCognitoIdentityProviderService.ChangePassword",
      {
        AccessToken: accessToken,
        PreviousPassword: currentPassword,
        ProposedPassword: newPassword,
      },
    )

    if (!cognitoResponse.ok) {
      const errorType = cognitoResponse.error.__type || ""
      const status = errorType.includes("NotAuthorizedException") ? 401 : cognitoResponse.status
      return NextResponse.json(
        {
          message: getFriendlyErrorMessage(
            errorType,
            cognitoResponse.error.message || "Unable to change password.",
          ),
        },
        { status },
      )
    }

    return NextResponse.json({ success: true, message: "Password changed successfully." }, { status: 200 })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
