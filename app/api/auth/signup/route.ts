import { type NextRequest, NextResponse } from "next/server"
import { cognitoRequest, getCognitoClientId } from "@/lib/cognito"

type CognitoSignUpResponse = {
  UserConfirmed?: boolean
  CodeDeliveryDetails?: {
    Destination?: string
    DeliveryMedium?: string
    AttributeName?: string
  }
  UserSub?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const cognitoResponse = await cognitoRequest<CognitoSignUpResponse>(
      "AWSCognitoIdentityProviderService.SignUp",
      {
        ClientId: getCognitoClientId(),
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: "email", Value: email },
        ],
      },
    )

    if (!cognitoResponse.ok) {
      const errorType = cognitoResponse.error.__type || ""
      if (errorType.includes("UsernameExistsException")) {
        return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 })
      }

      return NextResponse.json(
        { message: cognitoResponse.error.message || "Signup failed" },
        { status: cognitoResponse.status },
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Check your email for verification code.",
        userConfirmed: cognitoResponse.data.UserConfirmed ?? false,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
