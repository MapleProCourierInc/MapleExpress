import { type NextRequest, NextResponse } from "next/server"
import { decodeJwtPayload, cognitoRequest, getCognitoClientId } from "@/lib/cognito"

type CognitoInitiateAuthResponse = {
  AuthenticationResult?: {
    AccessToken?: string
    RefreshToken?: string
    IdToken?: string
    ExpiresIn?: number
    TokenType?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    const cognitoResponse = await cognitoRequest<CognitoInitiateAuthResponse>(
      "AWSCognitoIdentityProviderService.InitiateAuth",
      {
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: getCognitoClientId(),
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      },
    )

    if (!cognitoResponse.ok) {
      const errorType = cognitoResponse.error.__type || ""
      if (errorType.includes("UserNotConfirmedException")) {
        return NextResponse.json(
          {
            userStatus: "pendingEmailVerification",
            message: "Please verify your email address before logging in.",
          },
          { status: 200 },
        )
      }

      return NextResponse.json(
        { message: cognitoResponse.error.message || "Authentication failed" },
        { status: cognitoResponse.status },
      )
    }

    const authResult = cognitoResponse.data.AuthenticationResult
    const accessToken = authResult?.AccessToken
    const refreshToken = authResult?.RefreshToken
    const idToken = authResult?.IdToken

    if (!accessToken || !refreshToken || !idToken) {
      return NextResponse.json({ message: "Authentication failed" }, { status: 500 })
    }

    const payload = decodeJwtPayload(idToken || accessToken)
    const tokenExpiration = payload?.exp
      ? new Date(payload.exp * 1000).toISOString()
      : undefined
    const userId = payload?.sub || email
    const userType =
      (payload?.["custom:userType"] as string | undefined) ||
      (payload?.["custom:user_type"] as string | undefined) ||
      (payload?.["userType"] as string | undefined) ||
      "individualUser"

    const response = NextResponse.json(
      {
        tokenExpiration,
        userId,
        userStatus: "active",
        userType,
      },
      { status: 200 },
    )

    const isSecure = process.env.NODE_ENV === "production"
    const accessTokenCookieOptions = {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60,
    }
    const refreshTokenCookieOptions = {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 5,
    }

    response.cookies.set("maplexpress_access_token", accessToken, accessTokenCookieOptions)
    response.cookies.set("accessToken", accessToken, accessTokenCookieOptions)
    response.cookies.set("maplexpress_id_token", idToken, accessTokenCookieOptions)
    response.cookies.set("maplexpress_refresh_token", refreshToken, refreshTokenCookieOptions)

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
